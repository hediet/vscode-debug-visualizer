# VS Code Debug Visualizer

[![](https://img.shields.io/static/v1?style=social&label=Sponsor&message=%E2%9D%A4&logo=GitHub&color&link=%3Curl%3E)](https://github.com/sponsors/hediet)
[![](https://img.shields.io/static/v1?style=social&label=Donate&message=%E2%9D%A4&logo=Paypal&color&link=%3Curl%3E)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZP5F38L4C88UY&source=url)
[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

See [README.md](./extension/README.md) for the readme of the extension.

You can get the extension in the [marketplace](https://marketplace.visualstudio.com/items?itemName=hediet.debug-visualizer).

---

## Who/What is this extension for

- **Educators** - You can easily visualize the code which makes some difficult concepts easier to understand for your students.
- **Self-teaching** - Help yourself understand and debug code
- **Research**
- **Presentation**
- **Anyone who likes fun graphs** - Seriously, who doesn't!

## What is this extension not good with

- **Ease of use with compiled languages** - There's not yet good support for pre-compiled languages. The "data extractors" of the debug-visualizer work well with JS based languages but there are no "data extractors" yet for any pre-compiled languages.

  What this means for you, is if you want to use it with pre-compiled languages, you'll have to integrate code inside your codebase; code that returns data only the **debug-visualizer** understands.

  If you're interested in helping to solve this issue, you can help by [contributing](./CONTRIBUTING.md) :)
  
  ---

See [CONTRIBUTING.md](./CONTRIBUTING.md) for build instructions and implementation details.

![](./docs/doubly-linked-list-reverse-demo.gif)
