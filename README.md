# Cambodia Government Tax Calculator

## Project Overview (Developing)

This project is a browser-based tax calculator for Cambodia. It provides a single-page interface for estimating several common tax types, including VAT, salary tax, withholding tax, rental income tax, property tax, import duty, patent tax, public lighting tax, specific tax, unused land tax, accommodation tax, transportation tax, and vehicle tax.

The app is designed to be simple to use:

- Choose a tax category from the dropdown
- Enter the relevant amount or select the applicable tax type
- View the calculated tax amount, taxable income, and net payable value instantly

It also includes:

- English and Khmer language support
- Currency selection with KHR and USD conversion

## Tech Stack

- HTML
- CSS
- JavaScript

## Project Structure

- `index.html` - main application page
- `css/style.css` - application styling
- `js/main.js` - app logic and tax flow
- `js/tax/` - individual tax calculation modules
- `js/utils/` - shared DOM, formatting, and currency helpers
- `js/i18n/` - translation and language switching
- `data/field.json` - UI labels and localized text
- `public/images/` - branding assets used in the header

## How To Run

1. Open `index.html` in a browser, or serve the folder with a local static server.
2. Select a tax category.
3. Enter the relevant values.
4. Click `Calculate Now` if needed, or use the live updates while editing fields.

## Notes

- The application currently uses hardcoded tax rules in the JavaScript modules.
- Localized labels are loaded from `data/field.json`.
- The interface is intended for estimation and reference, not as an official tax filing tool.
