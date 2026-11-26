const BASE = "https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=";

const CODES = [
    "CONS",
    "BPC", "CIV", "CCP", "COM", "CORP",
    "EDC", "ELEC", "EVID", "FAM", "FIN",
    "FGC", "FAC", "GOV", "HNC", "HSC",
    "INS", "LAB", "MVC", "PEN", "PROB",
    "PCC", "PRC", "PUC", "RTC", "SHC",
    "UIC", "VEH", "WAT", "WIC"
];

const L2_URLS = CODES.map(code => ({
    code,
    url: BASE + code,
    endpoint: "codedisplayexpand.xhtml",
    level: 2,
    state: "pending"
}));

console.table(L2_URLS);
