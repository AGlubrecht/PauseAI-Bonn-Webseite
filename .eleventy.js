module.exports = function(eleventyConfig) {
  const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";

  const deWeekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const deMonths = ["Januar", "Februar", "März", "April", "Mai", "Juni",
                    "Juli", "August", "September", "Oktober", "November", "Dezember"];

  eleventyConfig.addFilter("deDate", function(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return `${deWeekdays[date.getDay()]} ${d}. ${deMonths[date.getMonth()]}`;
  });

  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/js");

  // Watch asset dirs so CSS/JS changes trigger a rebuild
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");

  return {
    pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
};
