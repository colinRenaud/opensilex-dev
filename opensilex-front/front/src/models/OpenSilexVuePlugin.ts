import { ApiServiceBinder, IAPIConfiguration } from '@/lib';
import { Container } from 'inversify';
import IHttpClient from '@/lib/IHttpClient';
import HttpClient from '@/lib/HttpClient';
import { ModuleComponentDefinition } from './ModuleComponentDefinition';
import Vue from 'vue';
import { User } from './User';
import { Store } from 'vuex';

declare var window: any;

export class OpenSilexVuePlugin {

    private container: Container;
    private baseApi: string;
    public $store: Store<any>;

    constructor(baseApi: string, store: Store<any>) {
        this.container = new Container();
        this.container.bind<IHttpClient>("IApiHttpClient").to(HttpClient).inSingletonScope();
        this.container.bind<IAPIConfiguration>("IAPIConfiguration").toConstantValue({
            basePath: baseApi
        });
        this.baseApi = baseApi;
        this.$store = store;
        ApiServiceBinder.with(this.container);
    }

    showLoader() {
        this.$store.commit("showLoader");
    }

    hideLoader() {
        this.$store.commit("hideLoader");
    }

    public install(Vue, options) {
        Vue.prototype.$opensilex = this;
        Vue.$opensilex = this;
    }

    public loadService<T>(id: string): Promise<T> {
        return new Promise((resolve, reject) => {
            try {
                let result: T | null = this.getServiceSync(id);
                if (result == null) {
                    let idParts = this.parseServiceId(id);
                    this.loadModule(idParts.module)
                        .then(() => {
                            resolve(this.getService(id));
                        })
                        .catch(reject)
                } else {
                    resolve(result);
                }
            } catch (error) {
                reject(error);
            }
        });

    }

    public getService<T>(id: string): T {
        let result: T | null = this.getServiceSync(id);
        if (result == null) {
            let errorMessage = "Module is not loaded for service " + id;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        return result;
    }

    public parseServiceId(id) {
        let idParts = id.split(".");
        if (idParts.length == 1) {
            return {
                module: null,
                service: idParts[0]
            };
        } else if (idParts.length == 2) {
            return {
                module: idParts[0],
                service: idParts[1]
            };
        } else {
            let errorMessage = "Invalid service identifier: " + id;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    public getServiceSync<T>(id: string): T | null {
        console.debug("Get API service", this.baseApi, id);
        let idParts = this.parseServiceId(id);
        if (idParts.module == null) {
            return this.getServiceContainer().get<T>(idParts.service);
        } else {
            if (this.loadedModules.indexOf(idParts.module) >= 0) {
                return this.getServiceContainer().get<T>(idParts.service);
            } else {
                return null;
            }
        }
    }

    private loadedModules: Array<string> = [
        "opensilex", "opensilex-front"

    ];

    private loadingModules = {
        "opensilex": Promise.resolve(null),
        "opensilex-front": Promise.resolve(null)
    };

    public loadModules(modules: Array<string>) {
        let promises: Array<Promise<any>> = [];
        for (let i in modules) {
            let moduleName = modules[i];

            if (!this.loadingModules[moduleName]) {
                this.loadingModules[moduleName] = this.loadModule(moduleName);
            }

            promises.push(this.loadingModules[moduleName])
        }

        return Promise.all(promises);
    }

    public loadComponentModules(components: Array<ModuleComponentDefinition>) {
        let promises: Array<Promise<any>> = [];

        for (let i in components) {
            promises.push(this.loadComponentModule(components[i]))
        }

        return Promise.all(promises);
    }

    public loadComponentModule(componentDef: ModuleComponentDefinition) {
        console.debug("Load component", componentDef.getId());
        let moduleName = componentDef.getModule();

        if (!this.loadingModules[moduleName]) {
            this.loadingModules[moduleName] = this.loadModule(moduleName);
        }

        if (this.loadingModules[moduleName] instanceof Promise) {
            return this.loadingModules[moduleName];
        }

        return Promise.resolve(this.loadingModules[moduleName]);
    }

    public loadModule(name) {
        if (window[name]) return window[name];

        console.debug("Load module", name);
        this.showLoader();
        let url = this.baseApi + "/front/extension/" + name + ".js";
        let self = this;

        window[name] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.async = true;
            script.addEventListener('load', () => {
                self.loadedModules.push(name);
                const plugin = window[name].default;
                Vue.use(plugin);
                self.initAsyncComponents(plugin.components)
                    .then(function (_module) {
                        self.hideLoader();
                        resolve(_module);
                    })
                    .catch(function (error) {
                        self.hideLoader();
                        reject(error);
                    });
            });
            script.addEventListener('error', () => {
                self.hideLoader();
                reject(new Error(`Error loading ${url}`));
            });
            script.src = url;
            document.head.appendChild(script);
        });

        return window[name];
    }

    public initAsyncComponents(components) {
        let promises: Array<Promise<any>> = [];
        if (components) {
            for (let componentId in components) {
                let component = components[componentId];
                if (component.asyncInit) {
                    try {
                        console.debug("Start component async init...", componentId);
                        promises.push(component.asyncInit(this));
                    } catch (error) {
                        promises.push(Promise.reject(error));
                    }
                }
                console.debug("Register component", componentId, component);
                Vue.component(componentId, components[componentId]);
            }
        }

        return new Promise((resolve, reject) => {
            Promise.all(promises)
                .then(() => {
                    console.debug("All components in module are initialized !");
                    resolve(window[name]);
                })
                .catch(reject);
        });

    }
    public getServiceContainer() {
        return this.container;
    }

    public get user(): User {
        return this.$store.state.user;
    }

    private handleError(error) {
        switch (error.status) {
            case 400:
                console.error("Constraint validation error", error);
                break;
            case 401:
                console.error("Unhautorized error", error);
                this.$store.commit("logout");
                break;
            case 403:
                console.error("Forbidden error", error);
                break;
            case 500:
                console.error("Internal server error", error);
                break;
            default:
                console.error("Unhandled error", error);
                break;
        }
    }

    public errorHandler = this.handleError.bind(this);
}