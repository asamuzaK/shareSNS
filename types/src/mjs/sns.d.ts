declare namespace _default {
    namespace Twitter {
        const id: string;
        const matchPattern: string;
        const menu: string;
        const url: string;
    }
    namespace Facebook {
        const id_1: string;
        export { id_1 as id };
        const menu_1: string;
        export { menu_1 as menu };
        const url_1: string;
        export { url_1 as url };
    }
    namespace LINE {
        const id_2: string;
        export { id_2 as id };
        const menu_2: string;
        export { menu_2 as menu };
        const url_2: string;
        export { url_2 as url };
    }
    namespace Hatena {
        const id_3: string;
        export { id_3 as id };
        const menu_3: string;
        export { menu_3 as menu };
        const url_3: string;
        export { url_3 as url };
    }
    namespace Mastodon {
        const id_4: string;
        export { id_4 as id };
        const menu_4: string;
        export { menu_4 as menu };
        const url_4: any;
        export { url_4 as url };
        export namespace subItem {
            namespace mastodonInstanceUrl {
                const url_5: string;
                export { url_5 as url };
            }
        }
    }
    namespace Pleroma {
        const id_5: string;
        export { id_5 as id };
        const menu_5: string;
        export { menu_5 as menu };
        const url_6: any;
        export { url_6 as url };
        export namespace subItem_1 {
            namespace pleromaInstanceUrl {
                const url_7: string;
                export { url_7 as url };
            }
        }
        export { subItem_1 as subItem };
    }
}
export default _default;
