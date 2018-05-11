(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.dataBinder = factory());
}(this, (function () { 'use strict';

    const viewRegex = /<view +template=['"]([\w-]+)['"]( +behaviours=['"]([\w-]+(, *[\w-]+)*)['"])? *\/?>(<\/view>)?/g;

    class ViewTemplate {
        /**
         * Constructor for ViewTemplate.
         *
         * @param (String) name                     The name of the view-template.
         * @param {String} html                     The html for the view-template.
         */
        constructor(name, html) {
            const maps = {
                viewNames: [],
                behaviourNames: [],
                html: []
            };
            let index = 0,
                match;
            while ((match = viewRegex.exec(html)) !== null) {
                maps.viewNames.push(match[1]);
                if (match[2]) {
                    maps.behaviourNames.push(match[3].split(" "));
                }
                maps.html.push(html.substring(index, match.index));
                index = match.index + match[0].length;
            }
            maps.html.push(html.substring(index));

            this.name = name;
            this._maps = maps;
        }
    }

    class ViewBehaviour {
        /**
         * Constructor for ViewTemplate.
         *
         * @param (String) name                   The name of the view-behaviour.
         * @param {String} js                     The html for the view-behaviour.
         * @param {String} forView                The name of the view-template the behaviour should be a default for.
         */
        constructor(name, js, forView = "") {
            this.name = name;
            if (forView != "") {
                this.for = forView;
            }
            this.func = new Function("return " + js.trim())();
        }
    }

// import strictdom from "strictdom";

// Using strictdom in dev to ensure proper use of DOM actions
// strictdom.enable();

// Miniature domBatcher implementation. heavily inspired by fastDOM
    const domBatcher = {
        scheduled: false,
        w: [],
        r: []
    };
    /**
     * Schedule a read or write DOM action to be performed in the next animation frame
     *
     * @param {Function} [action]         Dom action to perform
     * @param {String} [type]             Type of Dom action: 'r' or 'w'
     */
    function scheduleDomAction(action, type) {
        if (action) {
            domBatcher[type].push(action);
        }
        if (!domBatcher.scheduled) {
            domBatcher.scheduled = true;
            window.requestAnimationFrame(flush);
        }
    }
    function flush() {
        const reads = domBatcher.r;
        const writes = domBatcher.w;
        let error;
        try {
            let task;
            // strictdom.phase('measure');
            while (task = reads.shift()) {
                task();
            }
            // strictdom.phase(null);

            // strictdom.phase('mutate');
            while (task = writes.shift()) {
                task();
            }
            // strictdom.phase(null);
        } catch (e) {
            error = e;
        }

        domBatcher.scheduled = false;
        if (writes.length) {
            scheduleDomAction();
        }
        if (error) {
            console.error('task errored', error.message, error);
        }
    }

    const BINDING_MODES = {
        OneWay: "->",
        TwoWay: "<->",
        OneWayToSource: "<-",
        Default: "-"
    };
    const DEFAULT_TARGET = {
        Input: "value",
        Checkbox: "checked",
        Div: "innerText"
    };
    const ATTRIBUTE = "data-bindings";
    const REGEX = /([\w-]+) *((<?->?) *(\w+)?( *\((\w+)\))?)?/;
    const OBSERVER_OPTIONS = { childList: true, subtree: true, attributes: true, characterData: true };

    function handleDomMutation(bindingContext, events) {
        for (const event of events) {
            switch (event.type) {
                case "childList":
                    handleRemovedNodes(bindingContext, event.removedNodes);
                    handleAddedNodes(bindingContext, event.addedNodes);
                    break;
                case "attributes":
                    handleAttributeChanged(bindingContext, event);
                    break;
                case "characterData":
                    handleCharacterData(bindingContext, event);
                    break;
            }
        }
    }
    function handleRemovedNodes(bindingContext, nodes) {
        for (const node of nodes) {
            const bindings = bindingContext._map.get(node);
            if (!bindings) {
                continue;
            }
            for (const binding of bindings) {
                removeBinding(bindingContext, binding);
            }
            bindingContext._map.delete(node);
        }
    }
    function handleAddedNodes(bindingContext, nodes) {
        for (const node of nodes) {
            indexElement(bindingContext, node);
        }
    }
    function handleAttributeChanged(bindingContext, event) {
        const sender = event.target;
        if (!bindingContext._map.has(sender)) {
            return;
        }
        const target = event.attributeName;
        const binding = bindingContext._map.get(event.target)[target];
        if (!binding) {
            return;
        }
        scheduleDomAction(() => {
            const value = sender[target];
            setTimeout(() => propertyChanged(bindingContext, sender, binding.source, value), 0);
        }, 'r');
    }
    function handleCharacterData(bindingContext, event) {
        if (event.target.nodeName === "#text") {
            const sender = event.target.parentNode;
            if (!bindingContext._map.has(sender)) {
                return;
            }
            const binding = bindingContext._map.get(sender).innerText;
            if (binding && binding.mode === BINDING_MODES.OneWay) {
                scheduleDomAction(() => {
                    const value = sender[binding.target];
                    setTimeout(() => propertyChanged(bindingContext, sender, binding.source, value), 0);
                }, 'r');
            }
        }
    }

    function indexElement(bindingContext, htmlElement) {
        const bindings = getBindingsFromAttribute(htmlElement);
        const nodeName = htmlElement.nodeName.toLowerCase();
        for (const binding of bindings) {
            bindElement(bindingContext, htmlElement, binding, nodeName);
        }
        if (htmlElement.removeAttribute !== undefined) {
            scheduleDomAction(() => htmlElement.removeAttribute(ATTRIBUTE), 'w');
        }
    }
    function bindElement(bindingContext, htmlElement, bindingMatch, nodeName) {
        const binding = parseBinding(htmlElement, bindingMatch, nodeName);
        if (bindingContext._bindings[binding.source] === undefined) {
            bindingContext._bindings[binding.source] = [];
        }

        if (bindingContext._values[binding.source] === undefined) {
            scheduleDomAction(() => bindingContext._values[binding.source] = htmlElement[binding.target], 'r');
        } else if (binding.mode !== BINDING_MODES.OneWayToSource) {
            scheduleDomAction(() => htmlElement[binding.target] = bindingContext._values[binding.source], 'w');
        }

        if (bindingContext[binding.source] === undefined) {
            Object.defineProperty(bindingContext, binding.source, {
                get: () => bindingContext._values[binding.source],
                set: value => propertyChanged(bindingContext, null, binding.source, value)
            });
        }
        if (binding.event) {
            htmlElement.addEventListener(binding.event, getInputHandler(bindingContext, binding.source, binding.target));
        }
        bindingContext._bindings[binding.source].push(binding);
        addToMap(bindingContext, htmlElement, binding);
    }
    function parseBinding(htmlElement, bindingMatch, nodeName) {
        const binding = {
            element: htmlElement,
            source: bindingMatch[1],
            mode: bindingMatch[3] && bindingMatch[3] !== "-" ? bindingMatch[3] : getDefaultBindingMode(nodeName),
            target: bindingMatch[4] || getDefaultTarget(htmlElement, nodeName)
        };
        const event = bindingMatch[6] || getDefaultEvent(htmlElement, nodeName, binding.target);
        if (event) {
            binding.event = event;
        }
        return binding;
    }
    function addToMap(bindingContext, htmlElement, binding) {
        let bindings = bindingContext._map.get(htmlElement);
        if (bindings === undefined) {
            bindings = Object.create(null);
            bindingContext._map.set(htmlElement, bindings);
        } else {
            if (bindings[binding.target]) {
                console.warn(`binding '${binding.target}' overridden`, bindings, binding);
            }
        }
        bindings[binding.target] = binding;
    }
    function removeBinding(bindingContext, binding) {
        const bindings = bindingContext._bindings[binding.source];
        const index = bindings.indexOf(binding);
        if (index !== -1) {
            bindings.splice(index, 1);
        }
        if (bindings.length === 0) {
            delete bindingContext._bindings[binding.source];
        }
        if (binding.event) {
            binding.element.removeEventListener(binding.event, getInputHandler(bindingContext, binding.source, binding.target));
        }
    }

    function propertyChanged(bindingContext, sender, source, value) {
        if (bindingContext._values[source] === value) {
            return;
        }
        bindingContext._values[source] = value;
        const bindings = bindingContext._bindings[source];
        for (const binding of bindings) {
            if (binding.element !== sender && binding.mode !== BINDING_MODES.OneWayToSource) {
                scheduleDomAction(() => binding.element[binding.target] = value, 'w');
            }
        }

        if (bindingContext._listeners[source]) {
            for (const listener of bindingContext._listeners[source]) {
                listener(sender, value);
            }
        }
    }

    function getDefaultBindingMode(nodeName) {
        switch (nodeName) {
            case "input":
            case "select":
            case "textarea":
                return BINDING_MODES.TwoWay;
            default:
                return BINDING_MODES.OneWay;
        }
    }
    function getDefaultEvent(htmlElement, nodeName, target) {
        if (nodeName === "input") {
            if (target === DEFAULT_TARGET.Input) {
                return "input";
            }

            if (target === DEFAULT_TARGET.Checkbox) {
                const type = htmlElement.type.toLowerCase();
                if (type === "checkbox" || type === "radiobutton") {
                    return "change";
                }
            }
            return false;
        } else if (nodeName === "select" && target === "value") {
            return "input";
        } else if (nodeName === "textarea" && target === "value") {
            return "input";
        }
        return false;
    }
    function getDefaultTarget(htmlElement, nodeName) {
        switch (nodeName) {
            case "input":
                const type = htmlElement.type;
                if (type === "checkbox" || type === "radiobutton") {
                    return "checked";
                }
                return "value";
            case "textarea":
            case "select":
                return "value";
            case "form":
                return "onsubmit";
            default:
                return "innerText";
        }
    }

    function getInputHandler(bindingContext, source, target) {
        // Return function if already created, or create save and then return the newly created function
        return bindingContext._handlers[source] || (bindingContext._handlers[source] = event => {
            scheduleDomAction(() => {
                const value = event.target[target];
                setTimeout(propertyChanged(bindingContext, event.target, source, value), 0);
            }, 'r');
        });
    }
    function getBindingsFromAttribute(htmlElement) {
        let attr;
        if (htmlElement.getAttribute === undefined || !(attr = htmlElement.getAttribute(ATTRIBUTE))) {
            return [];
        }
        return attr.split(',').map(str => str.match(REGEX)).filter(match => match[1] !== undefined);
    }

    function indexDomElement(bindingContext, htmlElement) {
        indexElement(bindingContext, htmlElement);
        const elements = Array.from(htmlElement.getElementsByTagName("*"));
        for (const element of elements) {
            indexElement(bindingContext, element);
        }
        bindingContext._observer.observe(htmlElement, OBSERVER_OPTIONS);
    }

    /**
     * Add a view-template from html, and register it to this manager with the specified id.
     *
     * @param {String|Array} source           The id to assign to the view-template.
     * @param {Function} callback         The html for the view-template.
     */
    function onPropertyChanged(source, callback) {
        if (typeof source === 'string') {
            source = [source];
        }
        for (const prop of source) {
            if (!this._listeners[prop]) {
                this._listeners[prop] = [];
            }
            this._listeners[prop].push(callback);
        }
    }

    function indexBindingContext(bindingContext, props) {
        for (const prop of props) {
            bindingContext._values[prop] = bindingContext[prop];
            Object.defineProperty(bindingContext, prop, {
                get: () => bindingContext._values[prop],
                set: value => propertyChanged(bindingContext, null, prop, value)
            });
        }
    }

    function initFields(bindingContext) {
        bindingContext.onPropertyChanged = onPropertyChanged.bind(bindingContext);
        bindingContext._map = new WeakMap();
        bindingContext._bindings = Object.create(null);
        bindingContext._values = Object.create(null);
        bindingContext._handlers = Object.create(null);
        bindingContext._listeners = Object.create(null);
        bindingContext._observer = new MutationObserver(event => handleDomMutation(bindingContext, event));
    }

    /**
     * Sets up the binding between a bindingContext
     *
     * @param {Object} bindingContext       The bindingContext.
     * @param {Element} domElement          The view-template.
     * @param {String} html                 The html for the view-template.
     */
    function bind(bindingContext, domElement, html) {
        return new Promise((accept, reject) => {
            scheduleDomAction(() => {
                domElement.innerHTML = html;
                setTimeout(() => {
                    domElement.bindingContext = bindingContext;
                    if (bindingContext.onPropertyChanged === undefined) {
                        const props = Object.getOwnPropertyNames(bindingContext);
                        initFields(bindingContext);
                        indexBindingContext(bindingContext, props);
                    }
                    indexDomElement(bindingContext, domElement);
                    accept();
                }, 0);
            }, 'w');
        });
    }

    const ViewTemplateSelector = "script[type='text/template'][data-template]";
    const ViewBehaviourSelector = "script[type='text/javascript'][data-behaviour]";

    function getInnerTemplates(domElement) {
        return Array.prototype.slice.call(domElement.querySelectorAll(ViewTemplateSelector)).filter(t => t.id !== undefined).map(t => {
            return new ViewTemplate(t.id, t.innerHTML);
        });
    }

    function getInnerBehaviours(domElement) {
        return Array.prototype.slice.call(domElement.querySelectorAll(ViewBehaviourSelector)).reduce((acc, cur) => {
            const id = cur.id,
                forView = cur.getAttribute("for");
            if (id || forView) {
                const behaviour = new ViewBehaviour(id, cur.textContent, forView);
                acc.push(behaviour);
                return acc;
            }
        }, []);
    }

    function renderHtml(viewTemplate, manager, behaviours = []) {
        behaviours.push(...viewTemplate._maps.behaviourNames.map(name => manager.behaviours[name]));
        const html = viewTemplate._maps.viewNames.reduce((output, viewName, i) => {
            return output + renderHtml(manager.templates[viewName], manager, behaviours).html + viewTemplate._maps.html[i + 1];
        }, viewTemplate._maps.html[0]);
        return { html, behaviours: behaviours };
    }

    class ViewTemplateManager {
        /**
         * Constructor for ViewTemplateManager.
         */
        constructor() {
            this.templates = Object.create(null);
            this.behaviours = Object.create(null);
            this.defaultBehaviours = Object.create(null);

            this.registerBehaviour = this.registerBehaviour.bind(this);
            this.attachBehaviours = this.attachBehaviours.bind(this);
            this.registerTemplate = this.registerTemplate.bind(this);
            this.render = this.render.bind(this);

            this.getTemplates = this.getTemplates.bind(this);

            this.addTemplate = this.addTemplate.bind(this);
            this.addTemplateFromElement = this.addTemplateFromElement.bind(this);
            this.addTemplateById = this.addTemplateById.bind(this);
        }

        render(viewTemplateName, domNode, bindingContext = {}) {
            if (typeof domNode === 'string') {
                domNode = document.getElementById(domNode);
            }
            const { html, behaviours } = renderHtml(this.templates[viewTemplateName], this);

            if (this.defaultBehaviours[viewTemplateName]) {
                behaviours.push(...this.defaultBehaviours[viewTemplateName]);
            }
            const afterBindCallbacks = [];
            for (const behaviour of new Set(behaviours)) {
                const boundBehaviour = behaviour.func.call(bindingContext, bindingContext);
                Object.assign(bindingContext, boundBehaviour.properties);
                afterBindCallbacks.push(boundBehaviour.afterBind);
            }
            bind(bindingContext, domNode, html).then(() => {
                afterBindCallbacks.forEach(cb => cb());
            });
        }

        /**
         * Register a view-behaviour.
         * Register a behaviour, to be assigned to a bindingContext when rendering a view with the behaviour attached.
         * @param {String} name                 The name of the behaviour.
         * @param {Function} behaviourFunc      The function to build the behaviour-object to assign to a bindingContext.
         */
        registerBehaviour(name, behaviourFunc) {
            this.behaviours[name] = behaviourFunc;
        }

        attachBehaviours(viewTemplateName, ...behaviourFuncs) {
            if (this.defaultBehaviours[viewTemplateName] === undefined) {
                this.defaultBehaviours[viewTemplateName] = [];
            }
            this.defaultBehaviours[viewTemplateName].push(...behaviourFuncs);
        }

        /**
         * Register a view-template.
         * Register a view-template, to be rendered and bound to a bindingContext.
         * @param {String} name                     The name of the template.
         * @param {ViewTemplate} viewTemplate       The ViewTemplate instance.
         * @param defaultBehaviours                 Default behaviour attached to template
         */
        registerTemplate(name, viewTemplate, ...defaultBehaviours) {
            this.templates[name] = viewTemplate;
            if (defaultBehaviours.length) {
                this.attachBehaviours(name, ...defaultBehaviours);
            }
        }

        /**
         * Get templates from url (async).
         * Creates a XHR GET request for the specified url, parses the view-templates in it and registers them to this manager.
         * @param {String} urls           The url of the file(s) containing the view-templates.
         * @return {Promise} accept is triggered when all templates in external resources has been loaded into the manager.
         */
        getTemplates(...urls) {
            const promises = urls.map(url => {
                return new Promise((accept, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", url, true);
                    xhr.onload = e => {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                const container = document.createElement("div");
                                container.innerHTML = xhr.responseText;
                                const templates = getInnerTemplates(container);
                                const behaviours = getInnerBehaviours(container);
                                container.remove();
                                for (const template of templates) {
                                    this.registerTemplate(template.name, template);
                                }
                                for (const behaviour of behaviours) {
                                    if (behaviour.name) this.registerBehaviour(behaviour.name, behaviour);
                                    if (behaviour.for) this.attachBehaviours(behaviour.for, behaviour);
                                }
                                accept();
                            } else {
                                reject(xhr.statusText, xhr);
                            }
                        }
                    };
                    xhr.send(null);
                });
            });
            return Promise.all(promises);
        }

        /**
         * Add a view-template from html, and register it to this manager with the specified id.
         *
         * @param {String} id           The id to assign to the view-template.
         * @param {String} html         The html for the view-template.
         * @return {ViewTemplate} The newly created view-template.
         */
        addTemplate(id, html) {
            const viewTemplate = new ViewTemplate(id, html);
            this.registerTemplate(id, viewTemplate);
            return viewTemplate;
        }

        /**
         * Add a view-template from an HTMLElement, and register it to this manager with the specified id.
         * The html for the view-template is loaded from the innerHTML property of the HTMLElement.
         * @param {String} id                       The id to assign to the view-template.
         * @param {HTMLElement} htmlElement         The html for the view-template.
         * @return {ViewTemplate}                   The newly created view-template.
         */
        addTemplateFromElement(id, htmlElement) {
            return this.addTemplate(id, htmlElement.innerHTML);
        }

        /**
         * Add a view-template from the id of a HTMLElement in the DOM, and register it to this manager using the same id.
         * Gets a reference to the HTMLElemnt using document.getElementById and uses the innerHTML it, like addTemplateFromElement.
         * @param {String} id           The id of the HTMLElement in the DOM, and to assign to the view-template.
         * @return {ViewTemplate}       The newly created view-template.
         */
        addTemplateById(id) {
            return this.addTemplateFromElement(id, document.getElementById(id));
        }
    }

// Export as ES6 singleton
    var ViewTemplateManager$1 = new ViewTemplateManager();

    return ViewTemplateManager$1;

})));
