const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".desktop-nav");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !isOpen);
  });
  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  }));
}

const paperDialog = document.querySelector("#paper-dialog");
if (paperDialog) {
  let isClosing = false;
  let shopDestination = "";

  const closePaper = () => {
    if (!paperDialog.open || isClosing) return;
    isClosing = true;
    paperDialog.classList.remove("is-visible");
  };

  document.querySelectorAll("[data-paper-open]").forEach((link) => link.addEventListener("click", (event) => {
    const selectedContent = paperDialog.querySelector(`[data-paper-content="${link.dataset.paperOpen}"]`);
    if (!selectedContent) return;
    event.preventDefault();
    paperDialog.querySelectorAll("[data-paper-content]").forEach((content) => {
      content.hidden = content !== selectedContent;
    });
    if (!paperDialog.open) {
      isClosing = false;
      paperDialog.showModal();
      paperDialog.getBoundingClientRect();
      paperDialog.classList.add("is-visible");
    }
    paperDialog.querySelector(".paper-sheet").scrollTop = 0;
  }));

  paperDialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-paper-close]")) {
      closePaper();
      return;
    }
    const shopLink = event.target.closest("[data-paper-shop]");
    if (shopLink) {
      event.preventDefault();
      shopDestination = shopLink.href;
      closePaper();
      return;
    }
    if (event.target === paperDialog) closePaper();
  });

  paperDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePaper();
  });

  paperDialog.addEventListener("transitionend", (event) => {
    if (event.target === paperDialog && event.propertyName === "opacity" && isClosing) {
      const destination = shopDestination;
      shopDestination = "";
      paperDialog.close();
      if (destination) window.location.assign(destination);
    }
  });

  paperDialog.addEventListener("close", () => {
    isClosing = false;
  });
}
