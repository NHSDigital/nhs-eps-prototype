module.exports = function (env) { /* eslint-disable-line no-unused-vars */
  /**
   * Instantiate object used to store the methods registered as a
   * 'filter' (of the same name) within nunjucks. You can override
   * gov.uk core filters by creating filter methods of the same name.
   * @type {Object}
   */
  const filters = {};

  /* ------------------------------------------------------------------
    add your methods to the filters obj below this comment block:
    @example:

    filters.sayHi = function(name) {
        return 'Hi ' + name + '!'
    }

    Which in your templates would be used as:

    {{ 'Paul' | sayHi }} => 'Hi Paul'

    Notice the first argument of your filters method is whatever
    gets 'piped' via '|' to the filter.

    Filters can take additional arguments, for example:

    filters.sayHi = function(name,tone) {
      return (tone == 'formal' ? 'Greetings' : 'Hi') + ' ' + name + '!'
    }

    Which would be used like this:

    {{ 'Joel' | sayHi('formal') }} => 'Greetings Joel!'
    {{ 'Gemma' | sayHi }} => 'Hi Gemma!'

    For more on filters and how to write them see the Nunjucks
    documentation.

  ------------------------------------------------------------------ */

  filters.ukMobile = (input) => {
    if (!input) {
      return "01234 567890"; // Handle undefined or empty input
    }
    // remove whitespace
    input = input.replace(/\s/g,'')
    // add the space back in
    var number = input.substring(0, 5) + " " + input.substring(5)
    return number;
  }

  filters.calculateAge = (input) => {
    if (!input) {
      return "33"; // Handle undefined or empty input
    }

    // Parse the input date assuming format "D-MMM-YYYY"
    const parts = input.split('-');
    if (parts.length !== 3) {
      return "Invalid date format";
    }

    // Convert month from abbreviation to number (JavaScript months are 0-indexed)
    const months = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };
    const day = parseInt(parts[0], 10);
    const month = months[parts[1].toUpperCase()];
    const year = parseInt(parts[2], 10);

    // Create a date object from the parts
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    // Adjust age if current month/day is before the birth month/day
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  filters.formatNhsNumber = (input) => {

    // Check if 'number' is undefined or not a number
    if (input === undefined || isNaN(Number(input))) {
      return input; // Or handle however you see fit
    }

    input = input.toString();
    // Ensure the string is exactly 10 digits long
    if (input.length === 10) {
      return `${input.slice(0, 3)} ${input.slice(3, 6)} ${input.slice(6)}`;
    } else {
      return input; // Return the original number if it's not 10 digits
    }
  }

  // Add a custom filter to convert object to array with keys and values
  filters.objectToArray = (input) => {
    return Object.keys(input).map(key => ({
      id: key,
      ...input[key]
    }));
  }

  /* ------------------------------------------------------------------
    keep the following line to return your filters to the app
  ------------------------------------------------------------------ */
  return filters;
};
