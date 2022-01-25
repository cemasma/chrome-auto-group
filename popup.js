const IGNORED_URLS = [
    'chrome://',
    'file://',
];

const groupTabsButton = document.getElementById('groupTabsButton');

groupTabsButton.addEventListener("click", async () => {
    const { groups } = await prepareGroups();
    
    groupTabs({ groups }).catch((err) => {
        console.log('grouping tabs failed', err);
    })
});

async function prepareGroups() {
    const tabLookup = {};
    const tabs = await chrome.tabs.query({});

    tabs.forEach((tab) => {
        const url = tab.url;
        if (isUrlAvailableToGroup({ url })) {
            const { baseUrl } = getBaseUrl({ url });

            if (!tabLookup[baseUrl]) {
                tabLookup[baseUrl] = {
                    tabIds: [],
                };
            }

            tabLookup[baseUrl].tabIds.push(tab.id);
        }
    });

    return {
        groups: tabLookup,
    };
}

async function groupTabs({ groups }) {
    Object.keys(groups).forEach(async (key) => {
        if (groups[key].tabIds.length > 1) {
            const groupId = await chrome.tabs.group({
                tabIds: groups[key].tabIds,
            });

            chrome.tabGroups.update(groupId, {
                collapsed: true,
                title: key,
            });
        }
    });
}

function isUrlAvailableToGroup({ url }) {
    return !IGNORED_URLS.some((ignoredUrl) => url.startsWith(ignoredUrl));
}

function getBaseUrl({ url }) {
    const hostname = new URL(url).hostname.replace('www.', '');

    return {
        baseUrl: hostname.split('.')[0],
    };
}