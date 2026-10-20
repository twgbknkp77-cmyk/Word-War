# Word War prototype

Upload these items to the top level of the GitHub repository:

- `index.html`
- `style.css`
- `game.js`
- `words.txt`
- `custom-words.txt`
- the `assets` folder containing `characters.png`

GitHub Pages will rebuild automatically after the files are committed.

## Charged letters

- A five-letter word charges one newly drawn letter.
- A six- or seven-letter word charges two newly drawn letters.
- An eight-letter-or-longer word charges three newly drawn letters.
- Ember adds 4 damage, Ward blocks 3 incoming damage, and Bloom restores 3 health when the charged tile is used.

## Word list

`words.txt` is based on the 50,000-entry English frequency list from Hermit Dave's FrequencyWords project. After removing punctuation, numbers, one-letter entries, and duplicates, the game contains more than 46,000 words.

Source: https://github.com/hermitdave/FrequencyWords

Add one lowercase word per line to `custom-words.txt` whenever you want to approve a legitimate word that the main list lacks. Both files are combined when the game starts.

## Artwork

`assets/characters.png` is original AI-generated concept art created for this prototype. It contains the Spellscribe, Ink Goblin, and Stone Archivist in one transparent sprite sheet.
