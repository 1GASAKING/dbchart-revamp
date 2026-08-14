import { useRef, useEffect, useState } from "react";
import { CanvasConntextMenuButton, CanvasConntextMenuComponentMainDiv } from "../../styles/canvascomponentstyles/canvas-context-menu-component-styles";
import type { ContextMenuData } from "../../types/schema-node-ui"

interface ContextMenuComponentProps {
    contextMenu: ContextMenuData | null;
    onCreateNode: () => void;
    onCreateRelationship: () => void;
    onCreateArea:()=> void ;
}

const ContextMenuComponent = ({ contextMenu, onCreateNode, onCreateRelationship,onCreateArea }: ContextMenuComponentProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState<ContextMenuData | null>(null);

    useEffect(() => {
        if (contextMenu && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let { x, y } = contextMenu;
            const padding = 10;
            if (y + rect.height > window.innerHeight) {
                y = window.innerHeight - rect.height - padding;
            }
            if (x + rect.width > window.innerWidth) {
                x = window.innerWidth - rect.width - padding;
            }
            if (x < padding) x = padding;
            if (y < padding) y = padding;
            setAdjustedPos({ x, y });
        }
    }, [contextMenu]);

    if (!contextMenu) return null;

    const pos = adjustedPos ?? contextMenu;

    return (
        <CanvasConntextMenuComponentMainDiv
            ref={menuRef}
            className="canvas-context-menu"
            
            style={{top: pos.y, left: pos.x, zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()}
        >

            <div>
                <div className="canvas-context-menu-group  canvas-context-menu-group-border">
                    <CanvasConntextMenuButton onClick={onCreateNode}>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    New  node
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-symbol-field">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>
                    <CanvasConntextMenuButton onClick={onCreateRelationship}>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    new Relationship
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-debug-connected">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>

                </div>
                 <div className="canvas-context-menu-group canvas-context-menu-group-border  ">
                    <CanvasConntextMenuButton onClick={onCreateArea}>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    new  area
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-preview">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>
                    <CanvasConntextMenuButton>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    new note
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-comment-discussion-quote">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>

                </div>

                   <div className="canvas-context-menu-group   canvas-context-menu-group-border">
                    <CanvasConntextMenuButton>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    import  diagram
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-multiple-windows">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>
                    <CanvasConntextMenuButton>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    Import  SQL/DBML
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-cloud-download">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>

                </div>

                   <div className="canvas-context-menu-group   canvas-context-menu-group-border">
                   
                   
                    <CanvasConntextMenuButton>
                        <div>

                            <div>
                                <p className="canvas-context-menu-text">
                                    Save Version
                                </p>

                            </div>
                            <div>
                                <i className="codicon codicon-edit-session">

                                </i>
                            </div>
                        </div>
                    </CanvasConntextMenuButton>

                </div>
             
             
             
             


            </div>


        </CanvasConntextMenuComponentMainDiv>
    )
}

export default ContextMenuComponent