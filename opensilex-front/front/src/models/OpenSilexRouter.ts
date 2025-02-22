import { User } from './User';
import { OpenSilexVuePlugin } from '@/models/OpenSilexVuePlugin';
import Vue from 'vue';
import { ModuleComponentDefinition } from '@/models/ModuleComponentDefinition';
import { MenuItemDTO, FrontConfigDTO } from '@/lib';
import VueRouter from 'vue-router';

export class OpenSilexRouter {

    private frontConfig: FrontConfigDTO;
    private menu: Array<MenuItemDTO> = [];
    private router: any = this.createRouter(User.ANONYMOUS());

    public getMenu() {
        return this.menu;
    }

    public setConfig(config: FrontConfigDTO) {
        this.frontConfig = config;
    }

    public getRouter() {
        return this.router;
    }

    public createRouter(user: User) {
        let routes = this.computeMenuRoutes(user);

        this.router = new VueRouter({
            base: '/app',
            mode: 'history',
            routes: routes
        })

        return this.router;
    }

    public resetRouter(user: User) {
        const newRouter: any = this.createRouter(user);
        this.router.matcher = newRouter.matcher;
        return this.router;
    }

    public computeMenuRoutes(user: User) {
        let routes: Array<any> = [];

        let $opensilex: OpenSilexVuePlugin = Vue["$opensilex"];
        let frontConfig = this.frontConfig;

        if (frontConfig != undefined) {
            routes.push({
                path: "/",
                component: this.getAsyncComponentLoader($opensilex, frontConfig.homeComponent)
            });

            for (let i in frontConfig.routes) {
                let route = frontConfig.routes[i];

                if (user.hasCredentials(route.credentials)) {
                    routes.push({
                        path: route.path,
                        component: this.getAsyncComponentLoader($opensilex, route.component)
                    });
                }
            }

            this.menu = this.buildMenu(frontConfig.menu, routes, user);

            routes.push({
                path: "*",
                component: this.getAsyncComponentLoader($opensilex, frontConfig.notFoundComponent)
            });
        }

        return routes;
    }

    private getAsyncComponentLoader($opensilex, componentId) {
        return () => {
            return new Promise((resolve, reject) => {
                let componentDef = ModuleComponentDefinition.fromString(componentId);
                $opensilex.loadComponentModule(componentDef)
                    .then(() => {
                        let component: any = Vue.component(componentDef.getId());
                        if (component) {
                            resolve(component)
                        } else {
                            let result = this.getAsyncComponentLoader($opensilex, this.frontConfig.notFoundComponent)();
                            if (result instanceof Promise) {
                                result
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                resolve(result);
                            }
                        }
                    })
                    .catch(reject);
            })
        }
    }

    public refresh() {
        this.router.go();
    }

    private buildMenu(items: Array<MenuItemDTO>, routes: Array<any>, user: User) {
        let $opensilex: OpenSilexVuePlugin = Vue["$opensilex"];
        let menu: Array<MenuItemDTO> = [];

        for (let i in items) {
            let item: MenuItemDTO = items[i];
            let hasRouteAccess = false;

            if (item.route) {
                let route = item.route;
                if (user.hasCredentials(route.credentials)) {
                    hasRouteAccess = true;
                    menu.push(item);
                    routes.push({
                        path: route.path,
                        component: this.getAsyncComponentLoader($opensilex, route.component)
                    });
                }
            }

            let childItems: Array<MenuItemDTO> = [];
            if (item.children.length > 0) {
                childItems = this.buildMenu(item.children, routes, user);
            }

            if (!item.route && childItems.length > 0) {
                item.children = childItems;
                menu.push(item);
            }
        }

        return menu;
    }

}