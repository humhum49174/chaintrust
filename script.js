function calculateTokenScore(data, contractData, honeypotData, approvalData, phishingData) {
  let score = 100;
  const reasons = [];

  if (honeypotData?.is_honeypot === "1") {
    score -= 40;
    reasons.push("Honeypot detected");
  }
  if (data?.can_mint === "1") {
    score -= 15;
    reasons.push("Token is mintable");
  }
  if (data?.can_blacklist === "1") {
    score -= 10;
    reasons.push("Blacklist function detected");
  }
  if (contractData?.is_upgradable === "1") {
    score -= 10;
    reasons.push("Contract is upgradeable");
  }
  if (contractData?.selfdestruct === "1") {
    score -= 10;
    reasons.push("Self-destruct function present");
  }
  if (data?.owner_address && data.owner_address !== "0x0000000000000000000000000000000000000000") {
    score -= 10;
    reasons.push("Owner not renounced");
  }
  if (phishingData?.risk === "1") {
    score -= 5;
    reasons.push("Phishing domain risk");
  }
  if (approvalData?.is_approval_check_needed === "1") {
    score -= 5;
    reasons.push("Unusual approval risk");
  }

  let rating = "Excellent ✅";
  if (score <= 90) rating = "Good 👍";
  if (score <= 75) rating = "Warning ⚠️";
  if (score <= 50) rating = "High Risk ❌";
  if (score <= 20) rating = "Rug Pull 🚨";

  return { score, rating, reasons };
}

function renderScoreBox(scoreData) {
  const reasonsList = scoreData.reasons.map(r => `<li>${r}</li>`).join("");
  return `
    <div class="result-risk">
      <strong>💯 Score: ${scoreData.score} – ${scoreData.rating}</strong>
      <ul style="margin-top:10px; text-align:left; font-size:14px;">
        ${reasonsList}
      </ul>
    </div>
  `;
}
