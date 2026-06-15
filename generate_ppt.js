const pptxgen = require("pptxgenjs");

// Initialize presentation
let pres = new pptxgen();

pres.author = "CarbonChain";
pres.company = "CarbonChain";
pres.title = "CarbonChain Pitch Deck";
pres.layout = "LAYOUT_16x9";

// Define default text styles
const bodyStyle = { fontFace: "Helvetica", fontSize: 18, color: "333333" };
const titleStyle = { fontFace: "Helvetica", fontSize: 44, color: "10B981", bold: true };
const subTitleStyle = { fontFace: "Helvetica", fontSize: 24, color: "64748B", italic: true };

// Slide 1: Title Slide
let slide1 = pres.addSlide();
slide1.background = { color: "0B0E14" };
slide1.addText("CarbonChain", { x: 1, y: 2.5, w: 8, h: 1, ...titleStyle, align: "center" });
slide1.addText("Decentralized Carbon Credit Marketplace", { x: 1, y: 3.5, w: 8, h: 0.5, ...subTitleStyle, align: "center", color: "94A3B8" });

// Slide 2: The Core Problems
let slide2 = pres.addSlide();
slide2.background = { color: "FFFFFF" };
slide2.addText("The Core Problems", { x: 0.5, y: 0.5, w: 9, h: 1, ...titleStyle, color: "0B0E14", align: "left" });
slide2.addText(
    [
        { text: "1. Double Counting\n", options: { bold: true, fontSize: 22 } },
        { text: "The same carbon credit is often sold multiple times due to fragmented registries.\n\n", options: { fontSize: 16 } },
        { text: "2. Greenwashing\n", options: { bold: true, fontSize: 22 } },
        { text: "Low-quality projects claim high impact with little to no verifiable evidence.\n\n", options: { fontSize: 16 } },
        { text: "3. Exorbitant Middleman Fees\n", options: { bold: true, fontSize: 22 } },
        { text: "Traditional brokers and registries take 30-40% of the funds meant for climate projects.", options: { fontSize: 16 } }
    ],
    { x: 0.5, y: 1.8, w: 9, h: 3.5, ...bodyStyle, align: "left" }
);

// Slide 3: Our Solution
let slide3 = pres.addSlide();
slide3.background = { color: "0B0E14" };
slide3.addText("Our Solution", { x: 0.5, y: 0.5, w: 9, h: 1, ...titleStyle, align: "left" });
slide3.addText(
    [
        { text: "Immutable Token Ledgers\n", options: { bold: true, fontSize: 22, color: "34D399" } },
        { text: "Tokens permanently burned upon offset retirement to prevent double counting.\n\n", options: { fontSize: 16, color: "F8FAFC" } },
        { text: "IPFS-Backed Evidence Vaults\n", options: { bold: true, fontSize: 22, color: "34D399" } },
        { text: "Satellite imagery, IoT sensor data, and audit reports stored on IPFS.\n\n", options: { fontSize: 16, color: "F8FAFC" } },
        { text: "Zero-Intermediary Smart Contracts\n", options: { bold: true, fontSize: 22, color: "34D399" } },
        { text: "97.5% direct payouts to sellers in under 15 seconds.", options: { fontSize: 16, color: "F8FAFC" } }
    ],
    { x: 0.5, y: 1.8, w: 9, h: 3.5, ...bodyStyle, align: "left" }
);

// Slide 4: Transparent Token Ledger
let slide4 = pres.addSlide();
slide4.background = { color: "FFFFFF" };
slide4.addText("Transparent Token Ledger", { x: 0.5, y: 0.5, w: 9, h: 1, ...titleStyle, color: "0B0E14", align: "left" });
slide4.addText(
    "How we solve Double Counting:\n\n" +
    "• Every tonne of CO₂ offset is a unique ERC-1155 token.\n" +
    "• Single Ownership Enforced: No wallet can hold a token owned by another.\n" +
    "• Burn Mechanism: When an offset is claimed, the token is permanently destroyed.\n" +
    "• Public & Immutable: Anyone can audit the ledger history.",
    { x: 0.5, y: 1.8, w: 9, h: 3, ...bodyStyle, align: "left", bullet: true }
);

// Slide 5: Anti-Greenwashing AI Engine
let slide5 = pres.addSlide();
slide5.background = { color: "FFFFFF" };
slide5.addText("Anti-Greenwashing AI Engine", { x: 0.5, y: 0.5, w: 9, h: 1, ...titleStyle, color: "0B0E14", align: "left" });
slide5.addText(
    "How we verify quality:\n\n" +
    "• Satellite Imagery Analysis\n" +
    "• Live IoT Sensor Data Feeds (e.g., Chainlink Oracles)\n" +
    "• Third-Party Audit Reports on IPFS\n" +
    "• Multi-Modal AI (OpenAI, Grok, Gemini) evaluating project integrity based on verifiable data.",
    { x: 0.5, y: 1.8, w: 9, h: 3, ...bodyStyle, align: "left", bullet: true }
);

// Slide 6: Direct Seller Payouts
let slide6 = pres.addSlide();
slide6.background = { color: "0B0E14" };
slide6.addText("Direct Seller Payouts", { x: 0.5, y: 0.5, w: 9, h: 1, ...titleStyle, align: "left" });
slide6.addText(
    "Smart Contract Payouts vs Traditional Markets\n\n" +
    "OLD SYSTEM (Broker-based):\n" +
    "- Brokers, Registries, and Validators take 30-40%.\n" +
    "- Seller gets ~60%.\n" +
    "- Settlement time: 30–90 days.\n\n" +
    "CARBONCHAIN:\n" +
    "- Buyer pays -> Smart Contract -> Seller gets 97.5%.\n" +
    "- Protocol fee: 2.5%.\n" +
    "- Settlement time: < 15 seconds.",
    { x: 0.5, y: 1.8, w: 9, h: 3.5, ...bodyStyle, align: "left", color: "F8FAFC" }
);

// Slide 7: Technical Stack
let slide7 = pres.addSlide();
slide7.background = { color: "FFFFFF" };
slide7.addText("Technical Architecture", { x: 0.5, y: 0.5, w: 9, h: 1, ...titleStyle, color: "0B0E14", align: "left" });
slide7.addText(
    "Built for Scale & Transparency:\n\n" +
    "• Backend: High-performance Node.js Server\n" +
    "• AI Integration: OpenAI, Grok, Gemini support for due diligence\n" +
    "• Blockchain Elements: Polygon network, ERC-1155 and ERC-721 token standards\n" +
    "• Storage: Decentralized IPFS for immutable evidence\n" +
    "• Frontend: Modern, Responsive HTML5/CSS3 UI",
    { x: 0.5, y: 1.8, w: 9, h: 3, ...bodyStyle, align: "left", bullet: true }
);

// Save the Presentation
pres.writeFile({ fileName: "CarbonChain_Pitch.pptx" }).then(() => {
    console.log("created CarbonChain_Pitch.pptx");
}).catch(err => {
    console.error("error creating ppt:", err);
});
