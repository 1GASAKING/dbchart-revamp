import { type NodeProps, Handle, Position } from "@xyflow/react"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"
import { SchemaNodeComponentBody, SchemaNodeComponentEdgeHandle, SchemaNodeComponentField, SchemaNodeComponentFooter, SchemaNodeComponentHeader, SchemaNodeComponentMainDiv } from "../../styles/schemaNodeComponentStyles/schema-node-component-styles"
import { ReactComponent as ExpandIcon } from "./assets/expand-square-4.svg?react"
import type { DesignFlowNode } from "../../types/schema-node-ui"

const SchemaNodeComponent = ({ data }: NodeProps<DesignFlowNode>) => {
    const { node } = data;

    return (
        <SchemaNodeComponentMainDiv>
            <SchemaNodeComponentHeader>
                <div>
                    <div className="schema-node-header">
                        <div className="schema-label-header-indicator" />

                        <div className="schema-node-header-holder">

                            <div className="schema-label-header" title={node.label}>
                                <h4 className="schema-label-text">{node.label}</h4>
                            </div>

                        </div>

                    </div>

                </div>

            </SchemaNodeComponentHeader>

            <SchemaNodeComponentBody>
                <div>
                    {node.fields.map((field) => (
                        <SchemaNodeComponentField key={field.id}>
                           
                            <SchemaNodeComponentEdgeHandle>
                                 {field.connectable !== false && (
                                <Handle
                                className="handle"
                                    type="target"
                                    position={Position.Left}
                                    id={`${field.id}-target`}
                                />
                            )}

                            </SchemaNodeComponentEdgeHandle>
                            <div>
                                <div className="schema-data-type-field-item">
                                    <div className="schema-data-type-field-label">
                                        <div>
                                            <p className="schema-data-type-field-text">{field.name}</p>
                                        </div>
                                    </div>

                                    <div className="schema-data-type-field-label-type">
                                        <div>
                                            <p className="schema-data-type-field-text schema-data-type-field-data-type">{field.dataType}</p>
                                        </div>
                                    </div>

                                </div>

                            </div>
                            {field.connectable !== false && (
                                <Handle

                                    type="source"
                                    position={Position.Right}
                                    id={`${field.id}-source`}
                                />
                            )}
                        </SchemaNodeComponentField>
                    ))}
                </div>

            </SchemaNodeComponentBody>
            <SchemaNodeComponentFooter>
                <div>
                    <div className="schema-node-button ">
                        <VsButton className="text-icon-reveal">
                            <div>
                                <i className="codicon codicon-add-small"></i>                            </div>
                            <div className="text-holder">

                                <p className="button-text">
                                    Add Field
                                </p>

                            </div>

                        </VsButton>
                    </div>
                    <div className="schema-node-button ">

                        <VsButton className="text-icon-reveal">
                            <div>
                                <i className="codicon codicon-edit">

                                </i>

                            </div>
                            <div className="text-holder">

                                <p className="button-text">
                                    Edit
                                </p>

                            </div>

                        </VsButton>

                    </div>
                    <div className="schema-node-button ">
                        <VsButton className="text-icon-reveal">
                            <div>
                                <ExpandIcon width={16} height={19} />
                            </div>
                            <div className="text-holder">

                                <p className="button-text">
                                    Expand
                                </p>

                            </div>

                        </VsButton>
                    </div>

                </div>
            </SchemaNodeComponentFooter>

        </SchemaNodeComponentMainDiv>
    )

}
export default SchemaNodeComponent