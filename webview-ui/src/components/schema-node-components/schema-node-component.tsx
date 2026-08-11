import { type NodeProps, Handle, Position, useReactFlow } from "@xyflow/react"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"
import { SchemaNodeComponentBody, SchemaNodeComponentEdgeHandle, SchemaNodeComponentEditInput, SchemaNodeComponentEditSelect, SchemaNodeComponentField, SchemaNodeComponentHeader, SchemaNodeComponentMainDiv, SchemaNodeComponentToolBar } from "../../styles/schemaNodeComponentStyles/schema-node-component-styles"
import { ReactComponent as ExpandIcon } from "./assets/expand-square-4.svg?react"
import type { DesignFlowNode } from "../../types/schema-node-ui"
import { useEffect, useRef, useState } from "react"
import { createDesignField, DATA_TYPES } from "@lib/utils"

const SchemaNodeComponent = ({ id, data, selected }: NodeProps<DesignFlowNode>) => {
    const { node } = data;
    const mainDivRef = useRef<HTMLDivElement>(null);

    /** Ids of newly-added fields that are still being edited (unsaved drafts). */
    const [newFieldDraftIds, setNewFieldDraftIds] = useState<string[]>([]);
    /** Local edits for the draft field currently being edited. */
    const [draftName, setDraftName] = useState("");
    const [draftDataType, setDraftDataType] = useState<typeof DATA_TYPES[number]>(DATA_TYPES[0]);

    const { updateNodeData } = useReactFlow();

    const hasDraft = newFieldDraftIds.length > 0;

    const handleAddField = () => {
        const newField = createDesignField({
            name: `new_field_${node.fields.length + 1}`,
        });
        updateNodeData(id, {
            node: {
                ...node,
                fields: [...node.fields, newField],
            },
        });
        setNewFieldDraftIds((prev) => [...prev, newField.id]);
        setDraftName(newField.name);
        setDraftDataType(newField.dataType);
    };

    const handleSaveField = () => {
        const draftId = newFieldDraftIds[newFieldDraftIds.length - 1];
        if (!draftId) return;
        updateNodeData(id, {
            node: {
                ...node,
                fields: node.fields.map((field) =>
                    field.id === draftId
                        ? { ...field, name: draftName, dataType: draftDataType }
                        : field
                ),
            },
        });
        setNewFieldDraftIds((prev) => prev.filter((fid) => fid !== draftId));
        setDraftName("");
        setDraftDataType(DATA_TYPES[0]);
    };

    useEffect(() => {
        if (!hasDraft) return;
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (mainDivRef.current?.contains(target)) return;
            if (target.closest(".schema-node-toolbar")) return;
            updateNodeData(id, {
                node: {
                    ...node,
                    fields: node.fields.filter(
                        (field) => !newFieldDraftIds.includes(field.id)
                    ),
                },
            });
            setNewFieldDraftIds([]);
            setDraftName("");
            setDraftDataType(DATA_TYPES[0]);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [hasDraft, id, node, newFieldDraftIds, updateNodeData]);

    return (
        <SchemaNodeComponentMainDiv
            ref={mainDivRef}
            $bgColor={data.node.color}
            className={(selected ? "selected " : "") + "schema-node-toolbar"}
        >


            <SchemaNodeComponentToolBar position={Position.Top} align={"end"}>
                <div>
                    <div className="schema-node-button ">
                        <VsButton className="text-icon-reveal" onClick={handleAddField}>
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
                    {hasDraft && (
                        <div className="schema-node-button ">
                            <VsButton className="text-icon-reveal" onClick={handleSaveField}>
                                <div>
                                    <i className="codicon codicon-save"></i>
                                </div>
                                <div className="text-holder">
                                    <p className="button-text">Save</p>
                                </div>
                            </VsButton>
                        </div>
                    )}

                </div>
            </SchemaNodeComponentToolBar>
            <div>
                <SchemaNodeComponentHeader $bgColor={data.node.color}>
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
                        {node.fields.map((field) => {
                            const isEditing = newFieldDraftIds.includes(field.id);
                            return (
                            <SchemaNodeComponentField key={field.id}>

                                <SchemaNodeComponentEdgeHandle $color={field.color} className="left">
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
                                    {isEditing ? (
                                        <div className="schema-data-type-field-item">
                                            <div className="schema-data-type-field-label">
                                                <SchemaNodeComponentEditInput
                                                    autoFocus
                                                    value={draftName}
                                                    onChange={(e) => setDraftName(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveField(); }}
                                                />
                                            </div>
                                            <div className="schema-data-type-field-label-type">
                                                <SchemaNodeComponentEditSelect
                                                    value={draftDataType}
                                                    onChange={(e) => setDraftDataType(e.target.value as typeof DATA_TYPES[number])}
                                                >
                                                    {DATA_TYPES.map((dt) => (
                                                        <option key={dt} value={dt}>{dt}</option>
                                                    ))}
                                                </SchemaNodeComponentEditSelect>
                                            </div>
                                        </div>
                                    ) : (
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
                                    )}

                                </div>

                                <SchemaNodeComponentEdgeHandle $color={field.color} className="right" >
                                    {field.connectable !== false && (
                                        <Handle
                                            className="handle"
                                            type="source"
                                            position={Position.Right}
                                            id={`${field.id}-source`}
                                        />
                                    )}

                                </SchemaNodeComponentEdgeHandle>
                            </SchemaNodeComponentField>
                            );
                        })}
                    </div>

                </SchemaNodeComponentBody>



            </div>



        </SchemaNodeComponentMainDiv>
    )

}
export default SchemaNodeComponent




