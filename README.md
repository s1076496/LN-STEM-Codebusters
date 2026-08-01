# Cryptograms
Cryptograms generator and online solving for science Olympiad codebusters practice.

## Run locally
From the project directory, start a simple static server:

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/ in your browser.

## Features
- Loads quotes from quotes.json
- Encrypts each quote with a simple ACA-style aristocrat substitution
- Lets you fill in plaintext letters and updates every matching cipher letter instantly
- Checks whether the full quote is solved correctly
- Displays the author, character count, and elapsed solve time
