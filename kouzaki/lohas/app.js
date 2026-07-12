(function () {
  "use strict";

  var issues = Array.isArray(window.LOHAS_ISSUES) ? window.LOHAS_ISSUES : [];
  var state = { query: "", tag: "すべて", currentIndex: -1, zoom: 100 };

  var grid = document.getElementById("issue-grid");
  var search = document.getElementById("archive-search");
  var tagFilters = document.getElementById("tag-filters");
  var resultCount = document.getElementById("result-count");
  var clearFilters = document.getElementById("clear-filters");
  var emptyState = document.getElementById("empty-state");

  var reader = document.getElementById("reader");
  var readerClose = document.getElementById("reader-close");
  var readerKicker = document.getElementById("reader-kicker");
  var readerTitle = document.getElementById("reader-title");
  var readerMeta = document.getElementById("reader-meta");
  var readerPages = document.getElementById("reader-pages");
  var sourcePdf = document.getElementById("source-pdf");
  var previousIssue = document.getElementById("previous-issue");
  var nextIssue = document.getElementById("next-issue");
  var zoomOut = document.getElementById("zoom-out");
  var zoomIn = document.getElementById("zoom-in");
  var zoomLabel = document.getElementById("zoom-label");

  function normalize(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function makeElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function allTags() {
    var preferred = ["すべて", "農業", "交流会館", "村づくり", "写真", "神前米"];
    var found = {};
    issues.forEach(function (issue) {
      issue.tags.forEach(function (tag) { found[tag] = true; });
    });
    return preferred.filter(function (tag) { return tag === "すべて" || found[tag]; });
  }

  function renderTagFilters() {
    tagFilters.innerHTML = "";
    allTags().forEach(function (tag) {
      var button = makeElement("button", "tag-filter" + (state.tag === tag ? " active" : ""), tag);
      button.type = "button";
      button.setAttribute("aria-pressed", state.tag === tag ? "true" : "false");
      button.addEventListener("click", function () {
        state.tag = tag;
        renderTagFilters();
        renderIssues();
      });
      tagFilters.appendChild(button);
    });
  }

  function matches(issue) {
    var tagMatch = state.tag === "すべて" || issue.tags.indexOf(state.tag) !== -1;
    if (!tagMatch) return false;
    if (!state.query) return true;
    var haystack = normalize([
      issue.number,
      issue.series,
      issue.date,
      issue.title,
      issue.summary,
      issue.tags.join(" "),
      issue.searchText
    ].join(" "));
    return haystack.indexOf(state.query) !== -1;
  }

  function createCard(issue) {
    var card = makeElement("article", "issue-card");
    var button = makeElement("button", "issue-open");
    button.type = "button";
    button.setAttribute("aria-label", "第" + issue.number + "号を読む");

    var cover = makeElement("div", "cover-wrap");
    var image = document.createElement("img");
    image.src = issue.thumbnail;
    image.alt = issue.series + " 第" + issue.number + "号の表紙";
    image.loading = "lazy";
    cover.appendChild(image);

    var copy = makeElement("div", "issue-copy");
    var meta = makeElement("div", "issue-meta");
    meta.appendChild(makeElement("span", "", "NO. " + issue.number));
    meta.appendChild(makeElement("span", "", issue.date));
    copy.appendChild(meta);
    copy.appendChild(makeElement("h3", "", issue.title));
    copy.appendChild(makeElement("p", "", issue.summary));

    var tags = makeElement("div", "card-tags");
    issue.tags.forEach(function (tag) { tags.appendChild(makeElement("span", "", tag)); });
    copy.appendChild(tags);

    button.appendChild(cover);
    button.appendChild(copy);
    button.addEventListener("click", function () { openReader(issue.id); });
    card.appendChild(button);
    return card;
  }

  function renderIssues() {
    var visible = issues.filter(matches);
    grid.innerHTML = "";
    visible.forEach(function (issue) { grid.appendChild(createCard(issue)); });
    resultCount.textContent = visible.length + "冊を表示";
    emptyState.hidden = visible.length !== 0;
    clearFilters.hidden = !state.query && state.tag === "すべて";
  }

  function updateZoom() {
    var width = Math.round(900 * state.zoom / 100);
    document.documentElement.style.setProperty("--page-width", width + "px");
    zoomLabel.textContent = state.zoom + "%";
    zoomOut.disabled = state.zoom <= 70;
    zoomIn.disabled = state.zoom >= 140;
  }

  function updateReaderNav() {
    var previous = issues[state.currentIndex - 1];
    var next = issues[state.currentIndex + 1];
    previousIssue.disabled = !previous;
    nextIssue.disabled = !next;
    previousIssue.querySelector("strong").textContent = previous ? "第" + previous.number + "号" : "最初の号です";
    nextIssue.querySelector("strong").textContent = next ? "第" + next.number + "号" : "最後の号です";
  }

  function openReader(id) {
    var index = issues.findIndex(function (issue) { return issue.id === id; });
    if (index < 0) return;
    state.currentIndex = index;
    state.zoom = window.innerWidth <= 720 ? 100 : 90;
    var issue = issues[index];

    readerKicker.textContent = issue.series + " · NO. " + issue.number;
    readerTitle.textContent = issue.title;
    readerMeta.textContent = issue.date + " · " + issue.pageCount + "ページ";
    var canOpenSourcePdf = window.location.protocol === "file:" && issue.sourcePdf;
    sourcePdf.hidden = !canOpenSourcePdf;
    if (canOpenSourcePdf) sourcePdf.setAttribute("href", issue.sourcePdf);
    else sourcePdf.removeAttribute("href");
    readerPages.innerHTML = "";

    issue.pages.forEach(function (page, pageIndex) {
      var image = document.createElement("img");
      image.className = "reader-page";
      image.src = page;
      image.alt = "第" + issue.number + "号 " + (pageIndex + 1) + "ページ目";
      image.loading = pageIndex === 0 ? "eager" : "lazy";
      readerPages.appendChild(image);
    });

    updateZoom();
    updateReaderNav();
    if (!reader.open) reader.showModal();
    document.body.classList.add("reader-open");
    reader.scrollTop = 0;
    window.location.hash = "issue-" + issue.id;
  }

  function closeReader() {
    if (reader.open) reader.close();
    document.body.classList.remove("reader-open");
    if (window.location.hash.indexOf("#issue-") === 0) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  search.addEventListener("input", function () {
    state.query = normalize(search.value);
    renderIssues();
  });

  clearFilters.addEventListener("click", function () {
    state.query = "";
    state.tag = "すべて";
    search.value = "";
    renderTagFilters();
    renderIssues();
    search.focus();
  });

  readerClose.addEventListener("click", closeReader);
  reader.addEventListener("cancel", function (event) { event.preventDefault(); closeReader(); });
  reader.addEventListener("click", function (event) { if (event.target === reader) closeReader(); });
  previousIssue.addEventListener("click", function () {
    if (state.currentIndex > 0) openReader(issues[state.currentIndex - 1].id);
  });
  nextIssue.addEventListener("click", function () {
    if (state.currentIndex < issues.length - 1) openReader(issues[state.currentIndex + 1].id);
  });
  zoomOut.addEventListener("click", function () { state.zoom = Math.max(70, state.zoom - 10); updateZoom(); });
  zoomIn.addEventListener("click", function () { state.zoom = Math.min(140, state.zoom + 10); updateZoom(); });

  document.addEventListener("keydown", function (event) {
    if (!reader.open) return;
    if (event.key === "ArrowLeft" && state.currentIndex > 0) previousIssue.click();
    if (event.key === "ArrowRight" && state.currentIndex < issues.length - 1) nextIssue.click();
  });

  renderTagFilters();
  renderIssues();

  if (window.location.hash.indexOf("#issue-") === 0) {
    openReader(window.location.hash.replace("#issue-", ""));
  }
})();
