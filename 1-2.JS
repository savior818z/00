window.CA = (() => {

    "use strict";

    const select = (selector) =>
        [...document.querySelectorAll(selector)];

    const clean = (text) =>
        (text || "").replace(/\s+/g, " ").trim();

    const registry = {

        // Document identity
        page() {
            return {
                title: document.title,
                url: location.href,
                domain: location.hostname,
                endpoint: location.pathname.split("/").pop(),
                ready: document.readyState
            };
        },

        // DOM element registry
        dom(selector = "*") {
            return select(selector).map((e, i) => ({
                index: i + 1,
                tag: e.tagName,
                id: e.id,
                class: e.getAttribute("class"),
                parent: e.parentElement?.tagName,
                children: e.children.length
            }));
        },

        // Anchor registry
        links(selector = "a[href]") {
            return select(selector).map((e, i) => ({
                index: i + 1,
                text: clean(e.textContent),
                href: e.getAttribute("href"),
                url: e.href,
                id: e.id,
                eventHandler: e.hasAttribute("onclick")
            }));
        },

        // Unique HTTP(S) navigation URLs
        urls() {
            return [...new Set(
                this.links()
                    .filter(r => r.href && !r.href.startsWith("#")
                        && !r.eventHandler
                        && /^https?:\/\//.test(r.url))
                    .map(r => r.url)
            )];
        },

        // Legislative code registry
        codes() {
            return select(
                'a[href*="codesTOCSelected.xhtml"]'
            ).map((e, i) => ({
                index: i + 1,
                level: 2,
                code: new URL(e.href)
                    .searchParams.get("tocCode"),
                title: clean(e.textContent),
                url: e.href
            }));
        },

        // Navigation containers
        nav() {
            return select(
                'nav, [role="navigation"], #tabs, ' +
                '#system, #breadcrumbs, .horznavigation'
            ).map((e, i) => ({
                index: i + 1,
                tag: e.tagName,
                id: e.id,
                class: e.getAttribute("class"),
                links: e.querySelectorAll("a").length,
                text: clean(e.textContent)
            }));
        },

        // HTML tables
        tables() {
            return select("table").map((e, i) => ({
                index: i + 1,
                id: e.id,
                rows: e.rows.length,
                data: [...e.rows].map(r =>
                    [...r.cells].map(c =>
                        clean(c.textContent)
                    )
                )
            }));
        },

        // Lists
        lists() {
            return select("ul, ol, dl").map((e, i) => ({
                index: i + 1,
                tag: e.tagName,
                id: e.id,
                items: e.children.length,
                text: clean(e.textContent)
            }));
        },

        // CSS
        css() {
            return select(
                'link[rel="stylesheet"], style'
            ).map((e, i) => ({
                index: i + 1,
                type: e.tagName,
                url: e.href || "INLINE",
                media: e.getAttribute("media"),
                characters: e.textContent.length
            }));
        },

        // JavaScript
        js() {
            return select("script").map((e, i) => ({
                index: i + 1,
                url: e.src || "INLINE",
                type: e.type,
                characters: e.textContent.length
            }));
        },

        // Forms (excludes submitted field values)
        forms() {
            return [...document.forms].map((e, i) => ({
                index: i + 1,
                id: e.id,
                method: e.method,
                action: e.action,
                controls: e.elements.length
            }));
        },

        // Endpoint and level classification
        routes() {

            const levels = {
                "codes.xhtml": 1,
                "codesTOCSelected.xhtml": 2,
                "codedisplayexpand.xhtml": 3,
                "codes_displayexpandedbranch.xhtml": 4,
                "codes_displayText.xhtml": 5,
                "codes_displaySection.xhtml": 6,
                "codeBillCrossRef.xhtml": 7,
                "displayCodeAndBill.xhtml": 8,
                "asAmendsTheBill.xhtml": 9
            };

            return this.urls().map(url => {

                const u = new URL(url);
                const endpoint = u.pathname.split("/").pop();

                return {
                    level: levels[endpoint] ?? null,
                    endpoint,
                    code: u.searchParams.get("tocCode")
                        || u.searchParams.get("lawCode"),
                    url
                };
            });
        },

        // Page statistics
        stats() {
            return {
                elements: select("*").length,
                anchors: select("a[href]").length,
                urls: this.urls().length,
                codes: this.codes().length,
                navigation: this.nav().length,
                tables: this.tables().length,
                lists: this.lists().length,
                styles: this.css().length,
                scripts: this.js().length,
                forms: this.forms().length
            };
        },

        // Export consolidated inspection data
        all() {
            return {
                captured: new Date().toISOString(),
                page: this.page(),
                stats: this.stats(),
                codes: this.codes(),
                routes: this.routes(),
                links: this.links(),
                navigation: this.nav(),
                tables: this.tables(),
                lists: this.lists(),
                css: this.css(),
                js: this.js(),
                forms: this.forms(),
                dom: this.dom()
            };
        },

        // Display command output
        view(command, ...args) {
            if (!Object.hasOwn(this, command)
                || typeof this[command] !== "function"
                || command === "view") {
                return console.warn("Unknown command");
            }

            console.table(this[command](...args));
        },

        // Available commands
        help() {
            return Object.keys(this);
        }

    };

    console.log("CA DOM INTELLIGENCE | READY");

    return registry;

})();

console.table(CA.stats());
