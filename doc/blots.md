# Introduction of Blots in Quill

There's a blot tree existed when Quill is runing.

`Scroll` blot is the root of the blot tree, and has the ability of handling the blot tree.

1. Control the start and end signals when initializing or an update occured.
2. Operations on blots, such as insert, delete, or query

```javascript
// quill/blots/scroll.js
```