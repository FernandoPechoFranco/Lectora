(() => {
  try {
    if (sessionStorage.getItem("lectoraNovaAuthenticated") !== "true") {
      window.location.replace("../index.html");
      return;
    }
  } catch (error) {
    console.error("No se pudo comprobar la sesión de Lectora Nova.", error);
    window.location.replace("../index.html");
    return;
  }

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
