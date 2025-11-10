document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const messageDiv = document.getElementById("message");

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      // Clear loading message
      capabilitiesList.innerHTML = "";

      // Populate capabilities list
      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;

        // Create consultants HTML with delete icons
        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants (${currentConsultants}):</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (email) =>
                      `<li><span class="consultant-email">${email}</span><button class="delete-btn" data-capability="${name}" data-email="${email}" title="Unregister">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p class="no-consultants"><em>No consultants registered yet. Be the first!</em></p>`;

        capabilityCard.innerHTML = `
          <div class="card-header">
            <h4>${name}</h4>
            <span class="practice-badge">${details.practice_area}</span>
          </div>
          <p class="description">${details.description}</p>
          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">Industry Verticals:</span>
              <span class="meta-value">${details.industry_verticals ? details.industry_verticals.join(', ') : 'Not specified'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Capacity:</span>
              <span class="meta-value">${availableCapacity} hours/week</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Team Size:</span>
              <span class="meta-value">${currentConsultants} consultants</span>
            </div>
          </div>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
          <div class="card-actions">
            <button class="register-btn" data-capability="${name}">
              <span class="btn-icon">✨</span> Register Expertise
            </button>
          </div>
          <div class="inline-form hidden" id="form-${name.replace(/\s+/g, '-')}">
            <form class="register-form-inline" data-capability="${name}">
              <div class="form-group-inline">
                <label for="email-${name.replace(/\s+/g, '-')}">Your Email:</label>
                <input type="email" id="email-${name.replace(/\s+/g, '-')}" required placeholder="consultant@slalom.com" />
              </div>
              <div class="form-actions-inline">
                <button type="submit" class="submit-btn">✓ Confirm</button>
                <button type="button" class="cancel-btn" data-capability="${name}">✕ Cancel</button>
              </div>
            </form>
          </div>
        `;

        capabilitiesList.appendChild(capabilityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", showInlineForm);
      });

      // Add event listeners to cancel buttons
      document.querySelectorAll(".cancel-btn").forEach((button) => {
        button.addEventListener("click", hideInlineForm);
      });

      // Add event listeners to inline forms
      document.querySelectorAll(".register-form-inline").forEach((form) => {
        form.addEventListener("submit", handleInlineRegistration);
      });
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  // Show inline registration form
  function showInlineForm(event) {
    const button = event.currentTarget;
    const capability = button.getAttribute("data-capability");
    const formId = `form-${capability.replace(/\s+/g, '-')}`;
    const form = document.getElementById(formId);
    
    // Hide all other forms first
    document.querySelectorAll(".inline-form").forEach((f) => {
      f.classList.add("hidden");
    });
    
    // Show this form
    form.classList.remove("hidden");
    
    // Focus on email input
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.focus();
    }
  }

  // Hide inline registration form
  function hideInlineForm(event) {
    const button = event.currentTarget;
    const capability = button.getAttribute("data-capability");
    const formId = `form-${capability.replace(/\s+/g, '-')}`;
    const form = document.getElementById(formId);
    
    form.classList.add("hidden");
    
    // Reset the form
    const actualForm = form.querySelector("form");
    if (actualForm) {
      actualForm.reset();
    }
  }

  // Handle inline registration
  async function handleInlineRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const capability = form.getAttribute("data-capability");
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value;

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/register?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        form.reset();
        
        // Hide the inline form
        const formId = `form-${capability.replace(/\s+/g, '-')}`;
        const formContainer = document.getElementById(formId);
        if (formContainer) {
          formContainer.classList.add("hidden");
        }

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to register. Please try again.", "error");
      console.error("Error registering:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Show message helper function
  function showMessage(text, type) {
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Scroll to message
    messageDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Initial load
  fetchCapabilities();
});
