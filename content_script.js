// ClearHire Content Script
// Runs on LinkedIn, Indeed, Naukri.com, and ZipRecruiter to analyze listings for potential scams

console.log("ClearHire: Content script loaded on", window.location.href);

const JOBSCAN_CONFIG = {
  selectors: {
    linkedin: {
      jobTitle:
        ".jobs-unified-top-card__job-title, .top-card-layout__title, .job-details-jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title a, .jobs-unified-top-card__job-title a, h1.top-card-layout__title, [class*='job-title'], .job-title-text",
      company:
        ".jobs-unified-top-card__company-name a, .topcard__org-name-link, .job-details-jobs-unified-top-card__company-name a, .top-card-layout__second-subline .inline-show-more-text a, [class*='company-name'] a, .company-name-link",
      description:
        ".jobs-description__content .jobs-box__html-content, .jobs-description-content__text, #job-details, .job-details-jobs-unified-top-card__job-description, .jobs-description__content, .jobs-box__html-content, [class*='job-description'] div, .show-more-less-html__markup",
      salary:
        ".jobs-unified-top-card__job-insight, .job-details-jobs-unified-top-card__job-insight-view-model-secondary, .jobs-search-results__list .job-card-container__salary-info, [class*='salary'], .job-criteria__text",
      location:
        ".jobs-unified-top-card__bullet, .topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet, .job-criteria__text[class*='location'], [class*='location']",
    },
    indeed: {
      jobTitle:
        '[data-testid="jobsearch-JobInfoHeader-title"], h1[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title, .jobsearch-JobInfoHeader-title',
      company:
        '[data-testid="inlineHeader-companyName"] a, [data-testid="jobsearch-InlineCompanyRating"] a, .jobsearch-CompanyReview--heading, [data-testid="inlineHeader-companyName"], [data-testid="jobsearch-InlineCompanyRating-companyHeader"], .companyName',
      description:
        '#jobDescriptionText, [data-testid="jobsearch-jobDescriptionText"], .job-description',
      salary:
        '[data-testid="salary-snippet-container"], #salaryInfoAndJobType span, .jobsearch-JobMetadataHeader-itemWithIcon.salary-snippet, [data-testid="jobsearch-JobMetadataHeader-item"], .jobsearch-JobMetadataHeader-item, .salary-snippet-container',
      location:
        '[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle div, .jobsearch-JobInfoHeader-subtitle span, [data-testid="jobsearch-JobInfoHeader-subtitle"], .job-location',
    },
    ziprecruiter: {
      jobTitle: ".job_title span, h1.job_title",
      company:
        ".job_details_link.hiring_company_item, a.job_details_link[href*='/c/'], .company-name a",
      description: ".job_description, .job_description_text",
      salary: ".perk_item_body, span[data-name='perk_item_body_salary'], .salary-info",
      location: "span.location_text, .job_location .value, .location",
    },
    naukri: {
      jobTitle: ".job-header h1, .job-title h1, h1[class*='title']",
      company:
        ".job-header .company-name a, .company-name a, [class*='company'] a",
      description:
        ".job-description .dang-inner-html, .job-description div, [class*='description'] div",
      salary:
        ".salary .salary-data, .salary-info, [class*='salary']",
      location:
        ".location .location-data, .location-info, [class*='location']",
    },
  },
  statusElementId: "clearhire-status",
  debounceDelay: 1000,
};

let isAnalyzing = false;
let currentJobData = null;
let extensionEnabled = true;
let currentAnalysisResult = null;
let currentSite = null;

function detectCurrentSite() {
  const hostname = window.location.hostname;
  if (hostname.includes("linkedin.com")) return "linkedin";
  if (hostname.match(/indeed\./i)) return "indeed";
  if (hostname.includes("ziprecruiter.com")) return "ziprecruiter";
  if (hostname.includes("naukri.com")) return "naukri";
  return null;
}

init();

async function init() {
  try {
    currentSite = detectCurrentSite();
    if (!currentSite) {
      console.log("ClearHire: Unsupported site, not analyzing");
      return;
    }
    console.log("ClearHire: Detected site:", currentSite);

    if (!JOBSCAN_CONFIG.selectors[currentSite]) {
      console.warn(
        `ClearHire: No selectors configured for site: ${currentSite}. Analysis may be limited.`
      );
    }

    const response = await sendMessageToBackground({ type: "GET_SETTINGS" });
    if (response.success && response.settings) {
      extensionEnabled = response.settings.extensionEnabled;
    }
    if (!extensionEnabled) {
      console.log("ClearHire: Extension disabled, not analyzing");
      return;
    }

    // Enhanced timing for different sites
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startAnalysis);
    } else {
      // For LinkedIn, wait a bit longer for dynamic content
      if (currentSite === 'linkedin') {
        setTimeout(startAnalysis, 2000);
      } else if (currentSite === 'naukri') {
        setTimeout(startAnalysis, 1500);
      } else {
        startAnalysis();
      }
    }
    
    observePageChanges();
  } catch (error) {
    console.error("ClearHire: Initialization error:", error);
  }
}

function getElementText(selectorString) {
  if (!selectorString || typeof selectorString !== "string") return "";
  try {
    const el = document.querySelector(selectorString);
    return el ? el.textContent.trim() : "";
  } catch (e) {
    console.warn("ClearHire: Error querying selector:", selectorString, e);
    return "";
  }
}

function extractJobData() {
  const siteSelectors = JOBSCAN_CONFIG.selectors[currentSite];
  if (!siteSelectors) {
      console.warn(
        `ClearHire: No selectors available for site: ${currentSite}. Cannot extract job data.`
    );
    return {
      jobTitle: "",
      company: "",
      description: "",
      salary: "",
      location: "",
    };
  }
  const jobData = {
    jobTitle: getElementText(siteSelectors.jobTitle),
    company: getElementText(siteSelectors.company),
    description: getElementText(siteSelectors.description),
    salary: getElementText(siteSelectors.salary),
    location: getElementText(siteSelectors.location),
  };
  console.log("ClearHire: Extracted job data:", jobData);
  return jobData;
}

function startAnalysis() {
  if (!extensionEnabled || isAnalyzing) return;
  clearTimeout(startAnalysis.timeout);
  startAnalysis.timeout = setTimeout(() => {
    analyzeCurrentJob();
  }, JOBSCAN_CONFIG.debounceDelay);
}

async function analyzeCurrentJob() {
  if (isAnalyzing) return;
  isAnalyzing = true;
  try {
    const jobData = extractJobData();
    if (!jobData || !jobData.jobTitle) {
      console.log("ClearHire: No job data or job title found, skipping analysis");
      const existingStatus = document.getElementById(
        JOBSCAN_CONFIG.statusElementId
      );
      if (
        !existingStatus ||
        !existingStatus.textContent.includes("Could not find job details")
      ) {
        injectStatusElement("Could not find job details to analyze.", "info");
      }
      isAnalyzing = false;
      return;
    }
    currentJobData = jobData;
    injectStatusElement("Analyzing job listing...", "analyzing");
    const analysisResult = performHeuristicAnalysis(jobData);
    currentAnalysisResult = analysisResult;
    displayAnalysisResult(analysisResult);
    await sendMessageToBackground({
      type: "ANALYSIS_RESULT",
      data: {
        url: window.location.href,
        jobTitle: jobData.jobTitle,
        company: jobData.company,
        analysisResult: analysisResult,
      },
    });
  } catch (error) {
    console.error(
      "ClearHire: Analysis error during analyzeCurrentJob:",
      error,
      error.stack
    );
    injectStatusElement("Analysis failed. Check console for details.", "error");
  } finally {
    isAnalyzing = false;
  }
}

function performHeuristicAnalysis(jobData) {
  const result = { riskScore: 0, riskLevel: "low", flags: [], reasons: [] };

  const jobTitle = jobData.jobTitle || "";
  const description = jobData.description || "";
  const salaryText = jobData.salary || "";
  const company = jobData.company || "";
  const jobTitleLower = jobTitle.toLowerCase();

  if (jobTitle) {
    const suspiciousKeywords = [
      "make money fast",
      "work from home",
      "no experience required",
      "earn $",
      "guaranteed income",
      "easy money",
      "get rich",
      "financial freedom",
      "unlimited earning potential",
      "urgent hire",
      "immediate start",
      "bitcoin",
      "crypto",
      "forex",
      // Indian-specific suspicious keywords
      "data entry job",
      "ad posting work",
      "form filling job",
      "sms sending job",
      "email sending job",
      "online typing job",
      "work from home without investment",
      "daily payment",
      "weekly payment",
      "part time job",
      "home based job",
      "earn ₹",
    ];
    suspiciousKeywords.forEach((keyword) => {
      if (jobTitleLower.includes(keyword)) {
        result.riskScore +=
          keyword === "work from home" || keyword === "no experience required"
            ? 5
            : 15;
        result.flags.push("suspicious_keywords_title");
        result.reasons.push(`Suspicious keyword in title: "${keyword}"`);
      }
    });
  }

  if (description) {
    const grammarIssues = analyzeGrammar(description);
    if (grammarIssues.score > 3) {
      result.riskScore += 15;
      result.flags.push("poor_grammar");
      result.reasons.push(
        `Multiple grammar/formatting issues detected (${grammarIssues.issues.length} types)`
      );
    }
    const descKeywords = [
      "upfront fee",
      "investment required",
      "training fee",
      "telegram",
      "whatsapp contact",
      "must purchase equipment",
      "inventory fee",
      // Indian-specific fee-related keywords
      "registration fee",
      "security deposit",
      "pay to work",
      "buy software",
      "purchase kit",
      "training cost",
      "onboarding fee",
      "documentation fee",
      "interview fee",
      "processing fee",
      "background check fee",
      "verification fee",
    ];
    const descriptionLower = description.toLowerCase();
    descKeywords.forEach((keyword) => {
      if (descriptionLower.includes(keyword)) {
        result.riskScore += 20;
        result.flags.push("suspicious_keywords_desc");
        result.reasons.push(`Suspicious phrase in description: "${keyword}"`);
      }
    });
  }

  if (salaryText) {
    const salaryFlags = analyzeSalary(salaryText);
    if (salaryFlags.length > 0) {
      result.riskScore += 10 * salaryFlags.length;
      result.flags.push("suspicious_salary");
      salaryFlags.forEach((flagMsg) => {
        if (!result.reasons.includes(`Salary: ${flagMsg}`)) {
          // Avoid duplicate reasons if multiple salary flags produce same message
          result.reasons.push(`Salary: ${flagMsg}`);
        }
      });
    }
  }

  if (company) {
    const companyFlags = analyzeCompany(company);
    if (companyFlags.length > 0) {
      result.riskScore += 15 * companyFlags.length;
      result.flags.push("suspicious_company");
      companyFlags.forEach((flagMsg) => {
        if (!result.reasons.includes(`Company: ${flagMsg}`)) {
          result.reasons.push(`Company: ${flagMsg}`);
        }
      });
    }
  }

  // New: Check for high salary for common/junior roles
  const juniorRoleKeywords = [
    "assistant",
    "clerk",
    "customer service",
    "representative",
    "support",
    "data entry",
    "receptionist",
    "admin ",
    "administrative",
    // Indian-specific junior role keywords
    "telecaller",
    "caller",
    "tele executive",
    "back office",
    "fresher",
    "trainee",
    "intern",
    "junior executive",
    "executive trainee",
  ];
  const nonJuniorKeywords = [
    "executive",
    "senior",
    "manager",
    "director",
    "lead",
    "vp ",
    "president",
    "chief",
    "principal",
    "specialist",
  ];

  let isPotentiallyJuniorRole = false;
  for (const keyword of juniorRoleKeywords) {
    if (jobTitleLower.includes(keyword)) {
      isPotentiallyJuniorRole = true;
      break;
    }
  }
  if (isPotentiallyJuniorRole) {
    // If it might be junior, check it's not also senior
    for (const keyword of nonJuniorKeywords) {
      if (jobTitleLower.includes(keyword)) {
        isPotentiallyJuniorRole = false; // Override if it also has a senior keyword
        break;
      }
    }
  }

  if (isPotentiallyJuniorRole && salaryText) {
    const salaryLower = salaryText.toLowerCase();
    
    // Check for Indian salary formats
    const indianYearlyMatch = salaryLower.match(/(?:₹\s*|rs\s*|inr\s*)?([0-9,]+(?:\.[0-9]+)?)\s*(?:lakh|lpa|lakhs)/i);
    if (indianYearlyMatch) {
      const amount = parseFloat(indianYearlyMatch[1].replace(/,/g, ""));
      if (amount >= 12) { // 12+ lakhs INR for junior roles
        result.riskScore += 25;
        result.flags.push("high_salary_junior_role");
        result.reasons.push(
          `Potentially high salary (${indianYearlyMatch[0]}/year) listed for a common/junior role title.`
        );
      }
    }
    
    // Check for USD salaries with conversion
    const yearlySalaryMatch = salaryLower.match(
      /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:a year|annually|per year)/i
    );
    if (yearlySalaryMatch) {
      const amountStr = yearlySalaryMatch[1].replace(/,/g, "");
      const amount = parseFloat(amountStr);
      if (amount >= 80000) {
        result.riskScore += 25;
        result.flags.push("high_salary_junior_role");
        result.reasons.push(
          `Potentially high salary ($${yearlySalaryMatch[1]}/year) listed for a common/junior role title.`
        );
      }
    }
  }

  if (!company.trim()) {
    result.riskScore += 20;
    result.flags.push("missing_company");
    result.reasons.push("Company name appears to be missing or generic.");
  }
  if (!description.trim() || description.length < 150) {
    result.riskScore += 10;
    result.flags.push("missing_description");
    result.reasons.push("Job description is very short or missing.");
  }

  if (result.riskScore >= 40) result.riskLevel = "high";
  else if (result.riskScore >= 20) result.riskLevel = "medium";
  else result.riskLevel = "low";

  console.log("ClearHire: Analysis result:", result);
  return result;
}

function analyzeGrammar(text) {
  const result = { score: 0, issues: [] };
  if (!text || typeof text !== "string") return result;
  const patterns = [
    /[!]{2,}/g,
    /\?{2,}/g,
    /\$\$+/g,
    /\b\d+\s*\$\b/g,
    /\b[A-Z]{7,}\b/g,
    /\b\w+[.,?!:;]\w+\b/g,
    /\s+[.,?!:;]\B/g,
    /(.)\1{3,}/g,
  ];
  patterns.forEach((pattern) => {
    try {
      const matches = text.match(pattern);
      if (matches) {
        result.score += matches.length;
        const issueSource = pattern.source
          .replace(/\\b/g, "")
          .replace(/\\s\*/g, " ")
          .substring(0, 20);
        if (!result.issues.includes(issueSource))
          result.issues.push(issueSource);
      }
    } catch (e) {
      console.warn(
        "ClearHire: Error matching pattern in analyzeGrammar",
        pattern,
        e
      );
    }
  });
  return result;
}

function analyzeSalary(salaryText) {
  const flags = [];
  if (!salaryText || typeof salaryText !== "string") return flags;
  const salaryLower = salaryText.toLowerCase();

  if (
    salaryLower.includes("commission only") ||
    salaryLower.includes("commission-based")
  ) {
    flags.push("Potentially commission-only (verify details).");
  }
  if (salaryLower.includes("competitive") && !/\d/.test(salaryLower)) {
    flags.push("Vague salary term 'competitive' used without figures.");
  }

  // Check for Indian salary formats - high salaries
  const indianYearlyMatch = salaryLower.match(/(?:₹\s*|rs\s*|inr\s*)?([0-9,]+(?:\.[0-9]+)?)\s*(?:lakh|lpa|lakhs)/i);
  if (indianYearlyMatch) {
    const amount = parseFloat(indianYearlyMatch[1].replace(/,/g, ""));
    if (amount >= 25) { // 25+ lakhs INR is very high
      flags.push(
        `Unusually high Indian salary specified: "${indianYearlyMatch[0]}".`
      );
    }
  }

  // Check for high USD salaries with updated threshold
  const highYearlySalaryMatch = salaryLower.match(
    /(?:up to\s*)?\$\s*([\d,]+(?:\.\d{2})?)\s*(?:a year|annually|per year)/i
  );
  if (highYearlySalaryMatch) {
    const amountStr = highYearlySalaryMatch[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    if (amount >= 150000) { // Increased threshold for international market
      flags.push(
        `Unusually high yearly salary specified: "${highYearlySalaryMatch[0]}".`
      );
    }
  }

  const unrealisticPatterns = [
    /\$\d{4,}\s*(per day|daily)/i,
    /\$\d{3,}\s*(per hour|hourly)/i,
    /earn up to\s*\$\s*(\d{1,3}(,\d{3})*|\d{5,})/i,
    /make\s*\$\s*(\d{1,3}(,\d{3})*|\d{4,})\s*(a week|weekly)/i,
    // Indian-specific unrealistic patterns
    /earn\s*(?:₹\s*|rs\s*)?(\d{1,2},\d{3,}|\d{5,})\s*(daily|per day)/i,
    /₹\s*(\d{4,})\s*(per hour|hourly)/i,
  ];
  unrealisticPatterns.forEach((pattern) => {
    try {
      if (pattern.test(salaryText)) {
        flags.push("Potentially unrealistic salary claim detected.");
      }
    } catch (e) {
      console.warn(
        "ClearHire: Error matching pattern in analyzeSalary",
        pattern,
        e
      );
    }
  });
  return [...new Set(flags)];
}

function analyzeCompany(companyName) {
  const flags = [];
  if (!companyName || typeof companyName !== "string") return flags;

  // Check for placeholder-like prefixes
  const placeholderPrefixRegex =
    /\b(AnyHome|Any Business|Your Company|Your Business|My Company|My Business|Virtual Online|Global Net|World Wide|United Consumers|National Opportunities|Universal Group)\b/i;
  const placeholderMatch = companyName.match(placeholderPrefixRegex);
  if (placeholderMatch) {
    flags.push(
      `Company name may contain a generic placeholder: "${placeholderMatch[0]}".`
    );
  }

  const suspiciousNamePatterns = [
    /confidential/i,
    /private company/i,
    /undisclosed/i,
    /^work from home$/i,
    /online opportunity/i,
    /marketing group$/i,
    /financial services$/i,
    /global enterprises$/i,
    /solutions inc$/i,
    // Indian-specific suspicious patterns
    /bpo services$/i,
    /call center$/i,
    /data entry services$/i,
    /consultancy services$/i,
    /hr solutions$/i,
    /placement agency$/i,
    /recruitment firm$/i,
    /job consultancy$/i,
    /manpower solutions$/i,
    /tech solutions$/i,
    /digital marketing$/i,
    /online marketing$/i,
    /ecommerce solutions$/i,
  ];
  suspiciousNamePatterns.forEach((pattern) => {
    if (pattern.test(companyName)) {
      const match = companyName.match(pattern);
      flags.push(
        `Generic or vague company name pattern: "${
          match ? match[0] : companyName
        }"`
      );
    }
  });
  
  // Check for generic suffixes with short names
  const genericSuffixes = ["services", "solutions", "consultancy", "technologies", "systems"];
  const words = companyName.trim().split(/\s+/);
  if (words.length <= 2 && words.some(word => genericSuffixes.includes(word.toLowerCase()))) {
    flags.push(`Company name with generic suffix: "${companyName}"`);
  }
  
  if (
    companyName.length <= 3 &&
    /^[A-Z\s.&]+$/.test(companyName) &&
    !companyName.includes(" ")
  ) {
    flags.push(`Very short or initial-based company name: "${companyName}"`);
  }
  
  // Check for all-caps generic names
  if (companyName === companyName.toUpperCase() && companyName.length > 5 && 
      genericSuffixes.some(suffix => companyName.toLowerCase().includes(suffix))) {
    flags.push(`All-caps generic company name: "${companyName}"`);
  }
  
  return [...new Set(flags)];
}

function injectStatusElement(message, status = "info") {
  const existing = document.getElementById(JOBSCAN_CONFIG.statusElementId);
  if (existing) {
    existing.className = `jobscan-extension-root jobscan-status jobscan-status-${status}`;
    const messageSpan = existing.querySelector(".jobscan-message");
    if (messageSpan) messageSpan.textContent = message;
    const iconSpan = existing.querySelector(".jobscan-icon");
    if (iconSpan) {
      const icons = {
        analyzing: "⏳",
        success: "✅",
        warning: "⚠️",
        caution: "⚠️",
        error: "❌",
        info: "ℹ️",
      };
      iconSpan.textContent = icons[status] || "🚩";
    }
    return;
  }

  const statusElement = document.createElement("div");
  statusElement.id = JOBSCAN_CONFIG.statusElementId;
  statusElement.classList.add(
    "jobscan-extension-root",
    "jobscan-status",
    `jobscan-status-${status}`
  );
  statusElement.setAttribute("role", "alert");

  const content = document.createElement("div");
  content.className = "jobscan-status-content";
  const icon = document.createElement("span");
  icon.className = "jobscan-icon";
  const icons = {
    analyzing: "⏳",
    success: "✅",
    warning: "⚠️",
    caution: "⚠️",
    error: "❌",
    info: "ℹ️",
  };
  icon.textContent = icons[status] || "🚩";
  const msg = document.createElement("span");
  msg.className = "jobscan-message";
  msg.textContent = message;

  content.appendChild(icon);
  content.appendChild(msg);
  statusElement.appendChild(content);

  let containers = [];
  const siteSpecificContainers = {
    linkedin: [
      ".job-details-jobs-unified-top-card__primary-description-container",
      ".jobs-unified-top-card__primary-description",
      ".job-details-jobs-unified-top-card",
      ".jobs-unified-top-card",
      ".jobs-details",
      "main#main-content",
      "main",
      "body",
    ],
    indeed: [
      '[data-testid="jobsearch-JobInfoHeader"]',
      ".jobsearch-JobInfoHeader-title-container",
      ".jobsearch-ViewJobLayout-jobDisplay",
      ".jobsearch-JobComponent",
      ".jobsearch-SerpJobCard",
      "#viewJobSSRRoot",
      "#jobsearch-ViewjobLayout-jobDisplay",
      "body",
    ],
    ziprecruiter: [
      ".job_header",
      "div[class^='JobDetailsStickyHeader']",
      "main",
      "body",
    ],
    naukri: [
      ".job-header",
      ".job-detail",
      ".job-detail-container",
      ".job-section",
      "main",
      "body",
    ],
  };
  containers = siteSpecificContainers[currentSite] || ["body"];

  let inserted = false;
  for (const selector of containers) {
    const container = document.querySelector(selector);
    if (container) {
      try {
        // For LinkedIn, try to inject after the first element to avoid blocking
        if (currentSite === 'linkedin' && selector !== 'body') {
          if (container.children.length > 0) {
            container.children[0].parentNode.insertBefore(statusElement, container.children[0].nextSibling);
          } else {
            container.appendChild(statusElement);
          }
        } else {
          // For other sites, use normal injection
          if (container.firstChild && container.tagName !== "BODY") {
            container.insertBefore(statusElement, container.firstChild);
          } else {
            container.appendChild(statusElement);
          }
        }
        inserted = true;
        console.log("ClearHire: Status element injected/updated in:", selector);
        break;
      } catch (error) {
        console.warn("ClearHire: Failed to inject in", selector, error);
        continue;
      }
    }
  }
  
  // Fallback: always ensure element is visible
  if (!inserted || !document.getElementById(JOBSCAN_CONFIG.statusElementId)) {
    console.log("ClearHire: Could not find a suitable container, appending to body.");
    document.body.appendChild(statusElement);
  }
}

function displayAnalysisResult(result) {
  let message = "";
  let status = "info";
  switch (result.riskLevel) {
    case "high":
      message = `High risk suspected (Score: ${result.riskScore}). Proceed with extreme caution.`;
      status = "error";
      break;
    case "medium":
      message = `Medium risk suspected (Score: ${result.riskScore}). Review details carefully.`;
      status = "warning";
      break;
    case "low":
      message = `Low risk detected (Score: ${result.riskScore}).`;
      status = "success";
      break;
    default:
      message = `Analysis complete (Score: ${result.riskScore})`;
  }
  if (result.reasons.length > 0) {
    message += `\nFlags: ${result.reasons.slice(0, 3).join("; ")}${
      result.reasons.length > 3 ? "..." : ""
    }`;
  } else if (result.riskLevel === "low" && result.riskScore === 0) {
    // Specifically for score 0
    message = `No significant red flags detected (Score: 0).\nLooks generally safe, but always do your own research.`;
  } else if (result.riskLevel === "low") {
    message += `\nNo major red flags, but always verify independently.`;
  }
  injectStatusElement(message, status);
}

function observePageChanges() {
  let currentUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      console.log("ClearHire: URL changed to", currentUrl);
      const existing = document.getElementById(JOBSCAN_CONFIG.statusElementId);
      if (existing) existing.remove();
      const newSite = detectCurrentSite();
      if (newSite !== currentSite) {
        currentSite = newSite;
        console.log("ClearHire: Site re-detected as:", currentSite);
      }
      if (currentSite) {
        startAnalysis();
      }
    }
  });

  let jobContentObserverDebounceTimer;
  const jobContentObserver = new MutationObserver((mutations) => {
    let relevantChange = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const siteSelectors = JOBSCAN_CONFIG.selectors[currentSite];
        if (!siteSelectors) continue;
        
        const jobTitleSelector = siteSelectors.jobTitle;
        const jobDescSelector = siteSelectors.description;

        if (
          !relevantChange &&
          jobTitleSelector &&
          document.querySelector(jobTitleSelector)
        ) {
          if (
            mutation.target.querySelector &&
            (mutation.target.querySelector(jobTitleSelector) ||
              mutation.target.closest(jobTitleSelector))
          ) {
            relevantChange = true;
          }
        }
        if (
          !relevantChange &&
          jobDescSelector &&
          document.querySelector(jobDescSelector)
        ) {
          if (
            mutation.target.querySelector &&
            (mutation.target.querySelector(jobDescSelector) ||
              mutation.target.closest(jobDescSelector))
          ) {
            relevantChange = true;
          }
        }
        if (
          !relevantChange &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
        ) {
          const mainJobContainer = document.querySelector(
            currentSite === "linkedin"
              ? ".jobs-details__main-content, .jobs-unified-top-card"
              : currentSite === "indeed"
              ? ".jobsearch-ViewJobLayout-jobDisplay"
              : currentSite === "ziprecruiter"
              ? ".job_details_container"
              : currentSite === "naukri"
              ? ".job-header, .job-detail"
              : "body"
          );
          if (mainJobContainer && mainJobContainer.contains(mutation.target)) {
            relevantChange = true;
          }
        }
        if (relevantChange) {
          clearTimeout(jobContentObserverDebounceTimer);
          jobContentObserverDebounceTimer = setTimeout(() => {
            console.log("ClearHire: Job content potentially changed, re-analyzing.");
            startAnalysis();
          }, 2000);
          return;
        }
      }
    }
  });

  let observerRoot = document.body;
  if (currentSite === "linkedin")
    observerRoot =
      document.querySelector(".jobs-home__content") || document.querySelector("main") || document.body;
  else if (currentSite === "indeed")
    observerRoot =
      document.querySelector(".jobsearch-ViewJobLayout") || document.body;
  else if (currentSite === "naukri")
    observerRoot =
      document.querySelector(".job-header") || document.querySelector("main") || document.body;

  if (currentSite && JOBSCAN_CONFIG.selectors[currentSite]) {
    jobContentObserver.observe(observerRoot, {
      childList: true,
      subtree: true,
    });
  }
  console.log("ClearHire: Started observing page changes for:", currentSite);
}

function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "RedFlag: Error sending message to background:",
            chrome.runtime.lastError.message,
            "Message:",
            message
          );
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } catch (e) {
      console.error(
        "RedFlag: Exception sending message to background:",
        e,
        "Message:",
        message
      );
      reject(e);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("RedFlag: Content script received message:", message);
  switch (message.type) {
    case "GET_CURRENT_JOB":
      if (
        !currentJobData ||
        Date.now() - (currentAnalysisResult?.timestamp || 0) > 5000
      ) {
        currentJobData = extractJobData();
        if (currentJobData && currentJobData.jobTitle) {
          currentAnalysisResult = performHeuristicAnalysis(currentJobData);
          currentAnalysisResult.timestamp = Date.now(); // Add timestamp to analysis
        }
      }
      sendResponse({
        success: true,
        jobData: currentJobData,
        analysisResult: currentAnalysisResult,
        url: window.location.href,
      });
      break;
    case "REANALYZE":
      const existingStatus = document.getElementById(
        JOBSCAN_CONFIG.statusElementId
      );
      if (existingStatus) existingStatus.remove();
      startAnalysis();
      sendResponse({ success: true });
      break;
    case "TOGGLE_EXTENSION":
      extensionEnabled = message.enabled;
      const statusElement = document.getElementById(
        JOBSCAN_CONFIG.statusElementId
      );
      if (!extensionEnabled) {
        if (statusElement) statusElement.remove();
        console.log("ClearHire: Extension explicitly disabled via popup.");
      } else {
        console.log(
          "ClearHire: Extension explicitly enabled via popup, starting analysis."
        );
        if (statusElement) statusElement.remove();
        startAnalysis();
      }
      sendResponse({ success: true });
      break;
    default:
      console.warn(
        "ClearHire: Content script received unknown message type:",
        message.type
      );
      sendResponse({ success: false, error: "Unknown message type" });
  }
  return true;
});
