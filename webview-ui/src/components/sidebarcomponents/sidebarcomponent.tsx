import Tooltip from "../shared/Tooltip";
import { SideBarMainDiv, SideBarSection, SideBarSectionHeader, SideBarContent, ToggleCheckbox } from "../../styles/sidebarcomponentsstyles/sidebarcomponentstyles";
import ProjectsComponent from "./projectscomponents/projectscomponent";
import CloudAccountsComponent from "./accountscomponents/cloudaccountscomponent";
import SettingsHelpComponent from "./settingscomponents/settingshelpcomponent";

/** Dispatch a sidebar section action (handled by {@link ProjectsComponent}). */
const dispatchSidebarAction = (action: string) => {
  window.dispatchEvent(new CustomEvent("dbchart:sidebar-action", { detail: action }));
};

const SideBarComponent = () => {
    return (
        <SideBarMainDiv>
            <div>
                <SideBarSection>
                    <div>
                        <ToggleCheckbox id="projects-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="projects-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            connections 
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">
                                    <Tooltip text="new connection">
                                        <div
                                            className="icon-container section-action-holder"
                                            onClick={() => dispatchSidebarAction("new-connection")}
                                        >
                                            <i className="codicon codicon-add"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="new group">
                                        <div
                                            className="icon-container section-action-holder"
                                            onClick={() => dispatchSidebarAction("new-group")}
                                        >
                                            <i className="codicon codicon-new-collection"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="filter">
                                        <div
                                            className="icon-container section-action-holder"
                                            onClick={() => dispatchSidebarAction("toggle-filter")}
                                        >
                                            <i className="codicon codicon-filter"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="collapse all">
                                        <div
                                            className="icon-container section-action-holder"
                                            onClick={() => dispatchSidebarAction("collapse-all")}
                                        >
                                            <i className="codicon codicon-collapse-all"></i>
                                        </div>
                                    </Tooltip>
                                </div>

                            </div>
                        </SideBarSectionHeader>

                        <SideBarContent>
                            <ProjectsComponent />
                        </SideBarContent>
                    </div>
                </SideBarSection>

                <SideBarSection >
                    <div>
                        <ToggleCheckbox id="cloud-accounts-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="cloud-accounts-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            Cloud Accounts
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">
                                    <Tooltip text="register account">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-cloud"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </SideBarSectionHeader>

                        <SideBarContent>
                            <CloudAccountsComponent />
                        </SideBarContent>
                    </div>
                </SideBarSection>

                <SideBarSection >
                    <div>
                        <ToggleCheckbox id="settings-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="settings-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            Settings & Help
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">
                                    <Tooltip text="settings">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-gear"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </SideBarSectionHeader>

                        <SideBarContent>
                            <SettingsHelpComponent />
                        </SideBarContent>
                    </div>
                </SideBarSection>
                <SideBarSection>
                    <div>
                        <ToggleCheckbox id="bookmark-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="bookmark-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            BOOKMARK
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">

                                    <Tooltip text="Link connection">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-link"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="collpase all">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-collapse-all"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>


                        </SideBarSectionHeader>

                        <SideBarContent>
                            {/* Section content goes here */}
                        </SideBarContent>
                    </div>
                </SideBarSection>
                <SideBarSection>
                    <div>
                        <ToggleCheckbox id="query-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="query-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            query history
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">

                                    <Tooltip text="Link connection">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-link"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="collpase all">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-collapse-all"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>


                        </SideBarSectionHeader>

                        <SideBarContent>
                            {/* Section content goes here */}
                        </SideBarContent>
                    </div>
                </SideBarSection>
            </div>
        </SideBarMainDiv>
    );
};

export default SideBarComponent