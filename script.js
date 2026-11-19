const searchInput = document.getElementById("searchInput");
const resourceCards = Array.from(
  document.querySelectorAll(".resource-card")
);
const filterButtons = document.querySelectorAll(".filter-btn");
const resultsCount = document.getElementById("resultsCount");
const noResults = document.getElementById("noResults");
const clearFiltersButton = document.getElementById("clearFilters");
const sortSelect = document.getElementById("sortSelect");
const resourceGrid = document.querySelector(".resource-grid");
const searchSuggestions = document.getElementById("searchSuggestions");
const originalCards = [...resourceCards];
let activeCategory = "all";
let activeSuggestionIndex = -1;
let currentSuggestions = [];

const resources = resourceCards.map(function (card) {
  return {
    card: card,
    title: card.querySelector("h3").textContent.trim(),
    category: card.querySelector(".category").textContent.trim(),
    description: card.querySelector("p").textContent.trim()
  };
});

function filterResources() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let visibleCount = 0;

  resources.forEach(function (resource) {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.category.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm);

    const matchesCategory =
      activeCategory === "all" ||
      resource.category.toLowerCase() === activeCategory.toLowerCase();

    const shouldShow = matchesSearch && matchesCategory;

    resource.card.hidden = !shouldShow;

    if (shouldShow) {
      visibleCount++;
    }
  });

  resultsCount.textContent =
    `Showing ${visibleCount} of ${resources.length} resources`;

  noResults.hidden = visibleCount !== 0;

  const resultsHeading = document.querySelector(".results-header h3");

  if (resultsHeading) {
    resultsHeading.textContent =
      activeCategory === "all"
        ? "All resources"
        : `${activeCategory} resources`;
  }
}

function sortResources() {
  const sortValue = sortSelect.value;
  const sortedCards = [...originalCards];

  if (sortValue === "az") {
    sortedCards.sort(function (a, b) {
      return a.querySelector("h3").textContent.trim()
        .localeCompare(b.querySelector("h3").textContent.trim());
    });
  }

  if (sortValue === "za") {
    sortedCards.sort(function (a, b) {
      return b.querySelector("h3").textContent.trim()
        .localeCompare(a.querySelector("h3").textContent.trim());
    });
  }

  sortedCards.forEach(function (card) {
    resourceGrid.appendChild(card);
  });

  filterResources();
}

function closeSuggestions() {
  searchSuggestions.hidden = true;
  searchSuggestions.replaceChildren();

  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");

  activeSuggestionIndex = -1;
  currentSuggestions = [];
}

function updateActiveSuggestion() {
  const options = searchSuggestions.querySelectorAll(
    '[role="option"]'
  );

  options.forEach(function (option, index) {
    const isActive = index === activeSuggestionIndex;

    option.setAttribute("aria-selected", String(isActive));

    if (isActive) {
      searchInput.setAttribute(
        "aria-activedescendant",
        option.id
      );

      option.scrollIntoView({
        block: "nearest"
      });
    }
  });

  if (activeSuggestionIndex === -1) {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function selectSuggestion(index) {
  const selectedResource = currentSuggestions[index];

  if (!selectedResource) {
    return;
  }

  searchInput.value = selectedResource.title;

  closeSuggestions();
  filterResources();

  searchInput.focus();
}

function showSuggestions() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  closeSuggestions();

  if (!searchTerm) {
    return;
  }

  currentSuggestions = resources
    .filter(function (resource) {
      const matchesCategory =
        activeCategory === "all" ||
        resource.category.toLowerCase() === activeCategory.toLowerCase();

      const matchesTitle =
        resource.title.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesTitle;
    })
    .slice(0, 5);

  if (currentSuggestions.length === 0) {
    return;
  }

  currentSuggestions.forEach(function (resource, index) {
    const suggestion = document.createElement("li");

    suggestion.id = `search-suggestion-${index}`;
    suggestion.setAttribute("role", "option");
    suggestion.setAttribute("aria-selected", "false");

    suggestion.textContent = resource.title;

    // Prevent input blur before selecting.
    suggestion.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });

    suggestion.addEventListener("click", function () {
      selectSuggestion(index);
    });

    searchSuggestions.appendChild(suggestion);
  });

  searchSuggestions.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

searchInput.addEventListener("input", function () {
  filterResources();
  showSuggestions();
});

searchInput.addEventListener("focus", function () {
  showSuggestions();
});

searchInput.addEventListener("keydown", function (event) {
  const suggestionCount = currentSuggestions.length;

  if (event.key === "Escape") {
    closeSuggestions();
    return;
  }

  if (searchSuggestions.hidden || suggestionCount === 0) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    activeSuggestionIndex =
      (activeSuggestionIndex + 1) % suggestionCount;

    updateActiveSuggestion();
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();

    activeSuggestionIndex =
      activeSuggestionIndex <= 0
        ? suggestionCount - 1
        : activeSuggestionIndex - 1;

    updateActiveSuggestion();
  }

  if (event.key === "Enter" && activeSuggestionIndex >= 0) {
    event.preventDefault();
    selectSuggestion(activeSuggestionIndex);
  }
});

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    activeCategory = button.dataset.category;

    filterButtons.forEach(function (btn) {
      const isActive = btn === button;

      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    filterResources();
    closeSuggestions();
  });
});

sortSelect.addEventListener("change", function () {
  sortResources();
  closeSuggestions();
});


clearFiltersButton.addEventListener("click", function () {
  searchInput.value = "";
  activeCategory = "all";

  filterButtons.forEach(function (button) {
    const isActive = button.dataset.category === "all";

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  closeSuggestions();
  filterResources();

  searchInput.focus();
});

document.addEventListener("click", function (event) {
  const clickedInsideSearch =
    event.target.closest(".search-container");

  if (!clickedInsideSearch) {
    closeSuggestions();
  }
});

filterResources();
