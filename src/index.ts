import { name as isValidIdentifierName } from 'estree-util-is-identifier-name';
import { valueToEstree } from 'estree-util-value-to-estree';
import { load } from 'js-yaml';
import { Root, YAML } from 'mdast';
import { MdxjsEsm } from 'mdast-util-mdx';
import { parse } from 'toml';
import { Plugin } from 'unified';

export interface RemarkMdxFrontmatterOptions {
  /**
   * If specified, the YAML data is exported using this name. Otherwise, each
   * object key will be used as an export name.
   */
  name?: string;
}

/**
 * A remark plugin to expose frontmatter data as named exports.
 *
 * @param options - Optional options to configure the output.
 * @returns A unified transformer.
 */
export const remarkMdxFrontmatter: Plugin<[RemarkMdxFrontmatterOptions?]> =
  ({ name } = {}) =>
  (ast) => {
    const mdast = ast as Root;
    const assigns: MdxjsEsm[] = [];

    if (name && !isValidIdentifierName(name)) {
      throw new Error(
        `If name is specified, this should be a valid identifier name, got: ${JSON.stringify(
          name,
        )}`,
      );
    }

    for (const node of mdast.children) {
      let data: unknown;
      const { value } = node as YAML;
      if (node.type === 'yaml') {
        data = load(value);
        // @ts-expect-error A custom node type may be registered for TOML frontmatter data.
      } else if (node.type === 'toml') {
        data = parse(value);
      }
      if (data == null) {
        continue;
      }
      if (!name && typeof data !== 'object') {
        throw new Error(`Expected frontmatter data to be an object, got:\n${value}`);
      }

      assigns.push({
        type: 'mdxjsEsm',
        value: '',
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: Object.entries(data as object).map(([key, val]) => ({
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'MDXContent' },
                  property: { type: 'Identifier', name: key },
                  computed: false,
                  optional: false,
                },
                right: valueToEstree(val),
              },
            })),
          },
        },
      });
    }
    mdast.children.push(...assigns);
  };
