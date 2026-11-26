13:55:07.237 /**
 * ============================================================
 * CALIFORNIA LEGISLATIVE URL REGISTRY
 * ============================================================
 * Version:     1.1.0
 * Module:      L2 URL Generator
 * Source:      California Legislative Information
 * Environment: Browser / JavaScript
 * Dependencies: None
 *
 * PURPOSE
 * ------------------------------------------------------------
 * 1. Register all 30 California legislative code collections.
 * 2. Generate Level 2 expanded code URLs.
 * 3. Validate and deduplicate collection identifiers.
 * 4. Initialize crawl queue records.
 * 5. Support JSON, CSV and TXT exports.
 *
 * This module generates URLs only.
 * It does not fetch, crawl or modify the source website.
 * ============================================================
 */

(() => {
    "use strict";

    // ========================================================
    // 01. SOURCE CONFIGURATION
    // ========================================================

    const CONFIG = Object.freeze({
        version: "1.1.0",
        source: "California Legislative Information",
        origin: "https://leginfo.legislature.ca.gov",
        domain: "leginfo.legislature.ca.gov",
        directory: "/faces/",
        endpoint: "codedisplayexpand.xhtml",
        parameter: "tocCode",
        level: 2,
        parentLevel: 1,
        collection: "CA_LEGISLATIVE_CODES",
        expectedCount: 30
    });

    // ========================================================
    // 02. COLLECTION REGISTRY
    // ========================================================
    // Code identifiers mapped to their descriptive names.

    const CODES = Object.freeze({
        CONS: "California Constitution",
        BPC:  "Business and Professions Code",
        CIV:  "Civil Code",
        CCP:  "Code of Civil Procedure",
        COM:  "Commercial Code",
        CORP: "Corporations Code",
        EDC:  "Education Code",
        ELEC: "Elections Code",
        EVID: "Evidence Code",
        FAM:  "Family Code",
        FIN:  "Financial Code",
        FGC:  "Fish and Game Code",
        FAC:  "Food and Agricultural Code",
        GOV:  "Government Code",
        HNC:  "Harbors and Navigation Code",
        HSC:  "Health and Safety Code",
        INS:  "Insurance Code",
        LAB:  "Labor Code",
        MVC:  "Military and Veterans Code",
        PEN:  "Penal Code",
        PROB: "Probate Code",
        PCC:  "Public Contract Code",
        PRC:  "Public Resources Code",
        PUC:  "Public Utilities Code",
        RTC:  "Revenue and Taxation Code",
        SHC:  "Streets and Highways Code",
        UIC:  "Unemployment Insurance Code",
        VEH:  "Vehicle Code",
        WAT:  "Water Code",
        WIC:  "Welfare and Institutions Code"
    });

    // ========================================================
    // 03. CRAWL STATE DEFINITIONS
    // ========================================================

    const STATES = Object.freeze({
        PENDING:   "pending",
        QUEUED:    "queued",
        RUNNING:   "running",
        CAPTURED:  "captured",
        FAILED:    "failed",
        SKIPPED:   "skipped",
        RETRY:     "retry",
        VALIDATED: "validated",
        COMPLETE:  "complete"
    });

    // ========================================================
    // 04. URL CONSTRUCTOR
    // ========================================================
    // URL and URLSearchParams provide safer parameter handling
    // than manual string concatenation.

    function buildURL(code) {
        if (!Object.hasOwn(CODES, code)) {
            throw new Error(`Unknown collection: ${code}`);
        }

        const url = new URL(
            CONFIG.directory + CONFIG.endpoint,
            CONFIG.origin
        );

        url.searchParams.set(CONFIG.parameter, code);

        return url.href;
    }

    // ========================================================
    // 05. RECORD CONSTRUCTOR
    // ========================================================
    // Each collection receives a deterministic identifier.
    // The same collection generates the same ID on every run.

    function createRecord(code, name, index) {
        return {
            // Identity
            id: `CA:L02:${code}`,
            sequence: index + 1,

            // Classification
            code,
            name,
            collection: CONFIG.collection,
            jurisdiction: "US-CA",
            type: "code_collection",

            // Hierarchy
            level: CONFIG.level,
            parent_level: CONFIG.parentLevel,
            parent_id: "CA:L01:ROOT",
            path: `CA/${code}`,

            // Source
            source: CONFIG.source,
            domain: CONFIG.domain,
            endpoint: CONFIG.endpoint,
            method: "GET",
            url: buildURL(code),

            // Query parameters
            parameters: {
                [CONFIG.parameter]: code
            },

            // Queue management
            state: STATES.PENDING,
            priority: 0,
            attempts: 0,
            max_attempts: 3,

            // Capture metadata
            http_status: null,
            content_type: null,
            content_hash: null,
            capture_id: null,
            storage_path: null,

            // Discovery metadata
            children_count: null,
            discovered_urls: null,

            // Error tracking
            error: null,

            // Temporal metadata
            created_at: new Date().toISOString(),
            started_at: null,
            captured_at: null,
            updated_at: null,

            // Registry version
            registry_version: CONFIG.version
        };
    }

    // ========================================================
    // 06. GENERATE LEVEL 2 REGISTRY
    // ========================================================

    const L2_URLS = Object.entries(CODES).map(
        ([code, name], index) =>
            createRecord(code, name, index)
    );

    // ========================================================
    // 07. VALIDATION ENGINE
    // ========================================================
    // Validates registry structure and URL consistency.
    // Does not verify HTTP availability.

    function validate(records) {
        const errors = [];
        const ids = new Set();
        const urls = new Set();
        const codes = new Set();

        for (const record of records) {
            if (ids.has(record.id)) {
                errors.push(`Duplicate ID: ${record.id}`);
            }

            if (urls.has(record.url)) {
                errors.push(`Duplicate URL: ${record.url}`);
            }

            if (codes.has(record.code)) {
                errors.push(`Duplicate code: ${record.code}`);
            }

            if (!Object.hasOwn(CODES, record.code)) {
                errors.push(`Invalid code: ${record.code}`);
            }

            try {
                const url = new URL(record.url);

                if (url.origin !== CONFIG.origin) {
                    errors.push(`Invalid origin: ${record.url}`);
                }

                if (
                    url.pathname !==
                    CONFIG.directory + CONFIG.endpoint
                ) {
                    errors.push(`Invalid endpoint: ${record.url}`);
                }

                if (
                    url.searchParams.get(CONFIG.parameter)
                    !== record.code
                ) {
                    errors.push(`Parameter mismatch: ${record.id}`);
                }

            } catch {
                errors.push(`Malformed URL: ${record.url}`);
            }

            ids.add(record.id);
            urls.add(record.url);
            codes.add(record.code);
        }

        if (records.length !== CONFIG.expectedCount) {
            errors.push(
                `Expected ${CONFIG.expectedCount} records; ` +
                `received ${records.length}`
            );
        }

        return {
            valid: errors.length === 0,
            total: records.length,
            unique_ids: ids.size,
            unique_urls: urls.size,
            unique_codes: codes.size,
            errors
        };
    }

    // ========================================================
    // 08. QUERY AND FILTER FUNCTIONS
    // ========================================================

    function get(code) {
        return L2_URLS.find(
            record => record.code === String(code)
                .trim()
                .toUpperCase()
        ) || null;
    }

    function filter(state = STATES.PENDING) {
        return L2_URLS.filter(
            record => record.state === state
        );
    }

    function urls() {
        return L2_URLS.map(record => record.url);
    }

    function stats() {
        return L2_URLS.reduce((result, record) => {
            result[record.state] =
                (result[record.state] || 0) + 1;

            return result;
        }, {});
    }

    // ========================================================
    // 09. EXPORT ENGINE
    // ========================================================

    function download(content, filename, type) {
        const blob = new Blob([content], { type });
        const objectURL = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = objectURL;
        anchor.download = filename;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => {
            URL.revokeObjectURL(objectURL);
        }, 1000);
    }

    function exportJSON() {
        download(
            JSON.stringify(L2_URLS, null, 2),
            "CA_L2_REGISTRY.json",
            "application/json;charset=utf-8"
        );
    }

    function exportTXT() {
        download(
            urls().join("\n"),
            "CA_L2_URLS.txt",
            "text/plain;charset=utf-8"
        );
    }

    function exportCSV() {
        const headers = Object.keys(L2_URLS[0]);

        const escape = value => {
            if (value === null || value === undefined) {
                return '""';
            }

            const text = typeof value === "object"
                ? JSON.stringify(value)
                : String(value);

            return `"${text.replace(/"/g, '""')}"`;
        };

        const rows = L2_URLS.map(record =>
            headers.map(key => escape(record[key])).join(",")
        );

        download(
            [headers.join(","), ...rows].join("\r\n"),
            "CA_L2_REGISTRY.csv",
            "text/csv;charset=utf-8"
        );
    }

    // ========================================================
    // 10. PUBLIC MODULE INTERFACE
    // ========================================================
    // Exposes the registry for other crawler modules.

    window.CA_L2 = {
        config: CONFIG,
        codes: CODES,
        states: STATES,
        records: L2_URLS,

        get,
        filter,
        urls,
        stats,

        validate: () => validate(L2_URLS),

        export: {
            json: exportJSON,
            csv: exportCSV,
            txt: exportTXT
        },

        table: () => console.table(
            L2_URLS.map(record => ({
                id: record.id,
                code: record.code,
                name: record.name,
                level: record.level,
                state: record.state,
                url: record.url
            }))
        )
    };

    // ========================================================
    // 11. INITIALIZATION AND DIAGNOSTICS
    // ========================================================

    const report = validate(L2_URLS);

    console.group("CA Legislative Registry — Level 2");

    console.log("Version:", CONFIG.version);
    console.log("Collections:", L2_URLS.length);
    console.log("Validation:", report);

    if (report.valid) {
        console.info("Registry validation passed.");
    } else {
        console.error("Registry validation failed.", report.errors);
    }

    window.CA_L2.table();

    console.groupEnd();

})();
