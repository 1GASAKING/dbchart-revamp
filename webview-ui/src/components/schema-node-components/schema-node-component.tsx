import { type NodeProps, Handle, Position, useReactFlow } from "@xyflow/react"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"
import { SchemaNodeComponentBody, SchemaNodeComponentEdgeHandle, SchemaNodeComponentEditInput, SchemaNodeComponentEditSelect, SchemaNodeComponentField, SchemaNodeComponentHeader, SchemaNodeComponentMainDiv, SchemaNodeComponentToolBar } from "../../styles/schemaNodeComponentStyles/schema-node-component-styles"
import { ReactComponent as ExpandIcon } from "./assets/expand-square-4.svg?react"
import type { DesignFlowNode } from "../../types/schema-node-ui"
import type { FieldDataType, DesignField } from "@dbchart/schema"
import { useEffect, useRef, useState } from "react"
import { createDesignField, DATA_TYPES } from "@lib/utils"

type EditEntry = { name: string; dataType: FieldDataType }

const SchemaNodeComponent = ({ id, data, selected }: NodeProps<DesignFlowNode>) => {
    const { node } = data
    const mainDivRef = useRef<HTMLDivElement>(null)

    /** Which field ids are currently being edited */
    const [editingFieldIds, setEditingFieldIds] = useState<string[]>([])
    /** Per-field local edits — keyed by field id */
    const [localEdits, setLocalEdits] = useState<Record<string, EditEntry>>({})
    /** Fields that were just created and haven't been saved yet (for click-outside discard) */
    const [newFieldIds, setNewFieldIds] = useState<string[]>([])

    const { updateNodeData } = useReactFlow()

    const hasEdits = editingFieldIds.length > 0

    // --- helpers ---
    const populateEdits = (fields: DesignField[]) => {
        const entries: Record<string, EditEntry> = {}
        for (const f of fields) {
            entries[f.id] = { name: f.name, dataType: f.dataType }
        }
        setLocalEdits(entries)
    }

    const updateLocalName = (fieldId: string, name: string) => {
        setLocalEdits((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], name } }))
    }

    const updateLocalDataType = (fieldId: string, dataType: FieldDataType) => {
        setLocalEdits((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], dataType } }))
    }

    // --- add field ---
    const handleAddField = () => {
        const newField = createDesignField({ name: `new_field_${node.fields.length + 1}` })
        const updatedFields = [...node.fields, newField]
        updateNodeData(id, { node: { ...node, fields: updatedFields } })
        setEditingFieldIds((prev) => [...prev, newField.id])
        setNewFieldIds((prev) => [...prev, newField.id])
        setLocalEdits((prev) => ({ ...prev, [newField.id]: { name: newField.name, dataType: newField.dataType } }))
    }

    // --- toggle edit all ---
    const handleToggleEdit = () => {
        if (hasEdits) {
            // discard any unsaved changes and exit edit mode
            // restore original fields from node (which may have pending drafts removed)
            const restored = node.fields.filter((f) => !newFieldIds.includes(f.id))
            updateNodeData(id, { node: { ...node, fields: restored } })
            setEditingFieldIds([])
            setNewFieldIds([])
            setLocalEdits({})
        } else {
            // enter edit mode: all existing fields become editable
            populateEdits(node.fields)
            setEditingFieldIds(node.fields.map((f) => f.id))
            setNewFieldIds([])
        }
    }

    // --- save ---
    const handleSave = () => {
        const updated = node.fields.map((f) => {
            const edit = localEdits[f.id]
            return edit ? { ...f, name: edit.name, dataType: edit.dataType } : f
        })
        updateNodeData(id, { node: { ...node, fields: updated } })
        setEditingFieldIds([])
        setNewFieldIds([])
    }

    // --- save single field ---
    const handleSaveSingleField = (fieldId: string) => {
        const edit = localEdits[fieldId]
        if (!edit) return
        const updated = node.fields.map((f) =>
            f.id === fieldId ? { ...f, name: edit.name, dataType: edit.dataType } : f
        )
        updateNodeData(id, { node: { ...node, fields: updated } })
        setEditingFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
        setNewFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
    }

    // --- delete single field ---
    const handleDeleteField = (fieldId: string) => {
        updateNodeData(id, { node: { ...node, fields: node.fields.filter((f) => f.id !== fieldId) } })
        setEditingFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
        setNewFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
    }

    // --- click-outside: discard unsaved new fields ---
    useEffect(() => {
        if (newFieldIds.length === 0) return
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (mainDivRef.current?.contains(target)) return
            if (target.closest(".schema-node-toolbar")) return
            // discard new fields that haven't been saved
            updateNodeData(id, { node: { ...node, fields: node.fields.filter((f) => !newFieldIds.includes(f.id)) } })
            setEditingFieldIds((prev) => prev.filter((fid) => !newFieldIds.includes(fid)))
            setNewFieldIds([])
        }
        document.addEventListener("mousedown", handleOutsideClick)
        return () => document.removeEventListener("mousedown", handleOutsideClick)
    }, [newFieldIds, id, node, updateNodeData])

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
                                <i className="codicon codicon-add-small"></i>
                            </div>
                            <div className="text-holder">
                                <p className="button-text">Add Field</p>
                            </div>
                        </VsButton>
                    </div>
                    <div className="schema-node-button ">
                        <VsButton className="text-icon-reveal" onClick={handleToggleEdit}>
                            <div>
                                <i className="codicon codicon-edit"></i>
                            </div>
                            <div className="text-holder">
                                <p className="button-text">{hasEdits ? "save" : "Edit"}</p>
                            </div>
                        </VsButton>
                    </div>
                   
                   
                    <div className="schema-node-button ">
                        <VsButton className="text-icon-reveal">
                            <div>
                                <ExpandIcon width={16} height={19} />
                            </div>
                            <div className="text-holder">
                                <p className="button-text">Expand</p>
                            </div>
                        </VsButton>
                    </div>
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
                            const isEditing = editingFieldIds.includes(field.id)
                            const edit = localEdits[field.id]
                            return (
                                <SchemaNodeComponentField key={field.id}>
                                    <SchemaNodeComponentEdgeHandle $color={field.color} className="left">
                                        {field.connectable !== false && (
                                            <Handle className="handle" type="target" position={Position.Left} id={`${field.id}-target`} />
                                        )}
                                    </SchemaNodeComponentEdgeHandle>
                                    <div>
                                        {isEditing && edit ? (
                                            <div className="schema-data-type-field-item">
                                                <div className="schema-data-type-field-label">
                                                    <SchemaNodeComponentEditInput
                                                        autoFocus
                                                        value={edit.name}
                                                        onChange={(e) => updateLocalName(field.id, e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
                                                    />
                                                </div>
                                                <div className="schema-data-type-field-label-type">
                                                    <SchemaNodeComponentEditSelect
                                                        value={edit.dataType}
                                                        onChange={(e) => updateLocalDataType(field.id, e.target.value as FieldDataType)}
                                                    >
                                                        {DATA_TYPES.map((dt) => (
                                                            <option key={dt} value={dt}>{dt}</option>
                                                        ))}
                                                    </SchemaNodeComponentEditSelect>
                                                </div>

                                                <div className="flex field-buttons-holder ">
                                                        <div className="schema-node-button ">
                                                            <VsButton title="save" onClick={() => handleSaveSingleField(field.id)}>
                                                                <div>
                                                                    <i className="codicon codicon-save"></i>
                                                                </div>
                                                            </VsButton>
                                                        </div>


                                                   
                                                        <div className="schema-node-button ">
                                                            <VsButton title="delete" className=" delete-button" onClick={() => handleDeleteField(field.id)}>
                                                                    <i className="codicon codicon-trash"></i>
                                                            </VsButton>
                                                        </div>


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
                                    <SchemaNodeComponentEdgeHandle $color={field.color} className="right">
                                        {field.connectable !== false && (
                                            <Handle className="handle" type="source" position={Position.Right} id={`${field.id}-source`} />
                                        )}
                                    </SchemaNodeComponentEdgeHandle>
                                </SchemaNodeComponentField>
                            )
                        })}
                    </div>
                </SchemaNodeComponentBody>
            </div>
        </SchemaNodeComponentMainDiv>
    )
}
export default SchemaNodeComponent