# remark-mdx-frontmatter-alt

Alternative implementation of [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)
for [MDX](https://mdxjs.com/), that is more compatible with React Refresh.

The original implementation,
[remark-mdx-frontmatter](https://github.com/remcohaszing/remark-mdx-frontmatter), transforms
Markdown code:

```mdx
---
hello: frontmatter
---

Rest of document
```

To JavaScript with named exports:

```jsx
export const hello = 'frontmatter';

export default function MDXContent() {
  return <p>Rest of document</p>;
}
```

Looks fine. But React Refresh, the official React HMR plugin doesn't support non-component exports
along with component in the same file. The result is that Webpack/Vite will reloade the page (slow,
1~3s) when you modifying the MDX file, instead of a hot module replacement (fast, 50~200ms).

In this implementation, we export _ONLY_ the component. All frontmatter data will be assigned to the
component as static attributes:

```jsx
export default function MDXContent() {
  return <p>Rest of document</p>;
}

MDXContent.hello = 'frontmatter';
```

See [this issue](https://github.com/remcohaszing/remark-mdx-frontmatter/issues/9) and
[this discussion](https://github.com/vitejs/vite/discussions/4583) for more details.
