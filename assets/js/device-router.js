(() => {
  const mobileQuery = window.matchMedia("(max-width: 760px)");
  const currentPageIsMobile = window.location.pathname.endsWith("/dashboardM.html");

  function routeToMatchingLayout() {
    if (mobileQuery.matches !== currentPageIsMobile) {
      window.location.replace(mobileQuery.matches ? "dashboardM.html" : "dashboardP.html");
    }
  }

  routeToMatchingLayout();
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", routeToMatchingLayout);
  } else {
    mobileQuery.addListener(routeToMatchingLayout);
  }
})();
