# Owlysses: Word Odyssey

A mobile-first word-battle campaign for GitHub Pages.

## Publish

Upload **the contents of this folder** to the root of your public GitHub repository. Keep this structure:

```
index.html
style.css
game.js
words.txt
custom-words.txt
assets/
  owlysses.png
  enemies.png
  greek-road.png
```

In GitHub, open **Settings → Pages** and choose **Deploy from a branch**, then select **main** and **/(root)**. Do not upload the enclosing `word-war-greek-campaign` folder if your existing site already publishes from the repository root.

The game must be viewed through GitHub Pages (or another web server); opening `index.html` directly from a computer will prevent the dictionary files from loading.
