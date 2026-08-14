import { type NodeProps, Handle, Position, useReactFlow } from "@xyflow/react"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"
import { SchemaNodeComponentBody, SchemaNodeComponentEdgeHandle, SchemaNodeComponentEditInput, SchemaNodeComponentEditSelect, SchemaNodeComponentField, SchemaNodeComponentHeader, SchemaNodeComponentMainDiv, SchemaNodeComponentToolBar } from "../../styles/schemaNodeComponentStyles/schema-node-component-styles"
import { ReactComponent as ExpandIcon } from "./assets/expand-square-4.svg?react"
import { isDesignNode } from "../../types/schema-node-ui";
import type { DesignFlowNode, CanvasNode } from "../../types/schema-node-ui"
import type { FieldDataType, DesignField } from "@dbchart/schema"
import { useEffect, useRef, useState } from "react"
import { createDesignField, DATA_TYPES, validateFieldName, getFieldNameErrorMessage, validateSchemaName, getSchemaNameErrorMessage } from "@lib/utils"
import { useToast } from "../../contexts/toast-context"

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
    const [editingName, setEditingName] = useState(false)
    const [name, setName] = useState(node.label)
    const { getNodes, updateNodeData } = useReactFlow<CanvasNode>()
    const { showToast } = useToast()

    const hasNewField = newFieldIds.length > 0
    const hasEdits = editingFieldIds.length > 0

    // --- helpers ---
    const populateEdits = (fields: DesignField[]) => {
        const entries: Record<string, EditEntry> = {}
        for (const f of fields) { entries[f.id] = { name: f.name, dataType: f.dataType } }
        setLocalEdits(entries)
    }

    const updateLocalName = (fieldId: string, name: string) =>
        setLocalEdits((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], name } }))

    const updateLocalDataType = (fieldId: string, dataType: FieldDataType) =>
        setLocalEdits((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], dataType } }))

    // --- reset: bring edit state to neutral ---
    const resetEditState = () => {
        // discard unsaved new fields from node
        if (newFieldIds.length > 0) {
            updateNodeData(id, { node: { ...node, fields: node.fields.filter((f) => !newFieldIds.includes(f.id)) } })
        }
        setEditingFieldIds([])
        setNewFieldIds([])
        setLocalEdits({})
    }

    const saveNodeName = () => {
        const allLabels = getNodes()
            .filter(isDesignNode)
            .map((n) => ({ id: n.id, label: n.data.node.label }));
        const error = validateSchemaName(name, id, allLabels);
        if (error) { showToast(getSchemaNameErrorMessage(error)); return; }
        updateNodeData(id, { node: { ...node, label: name.trim() } });
        setEditingName(false);
    };

    // --- add field ---
    const handleAddField = () => {
        // stop edit-all mode if active, but leave existing new fields alone
        if (hasEdits && !hasNewField) {
            setEditingFieldIds([])
            setLocalEdits({})
        }
        const newField = createDesignField({ name: `new_field_${node.fields.length + 1}` })
        updateNodeData(id, { node: { ...node, fields: [...node.fields, newField] } })
        setEditingFieldIds((prev) => [...prev, newField.id])
        setNewFieldIds((prev) => [...prev, newField.id])
        setLocalEdits((prev) => ({ ...prev, [newField.id]: { name: newField.name, dataType: newField.dataType } }))
    }

    // --- save new field (inline) ---
    const handleSaveSingleField = (fieldId: string) => {
        const edit = localEdits[fieldId]
        if (!edit) return
        const error = validateFieldName(edit.name, fieldId, node.fields)
        if (error) { showToast(getFieldNameErrorMessage(error)); return }
        const updated = node.fields.map((f) =>
            f.id === fieldId ? { ...f, name: edit.name, dataType: edit.dataType } : f
        )
        updateNodeData(id, { node: { ...node, fields: updated } })
        setEditingFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
        setNewFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
    }

    // --- delete new field ---
    const handleDeleteField = (fieldId: string) => {
        updateNodeData(id, { node: { ...node, fields: node.fields.filter((f) => f.id !== fieldId) } })
        setEditingFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
        setNewFieldIds((prev) => prev.filter((fid) => fid !== fieldId))
    }

    // --- edit all: toggle in / save all ---
    const handleEditOrSaveAll = () => {
        // first reset any pending new fields
        if (hasNewField) { resetEditState(); return }
        if (hasEdits) {
            // Validate all fields
            const errors: Record<string, string> = {}
            for (const f of node.fields) {
                const edit = localEdits[f.id]
                if (!edit) continue
                const err = validateFieldName(edit.name, f.id, node.fields)
                if (err) errors[f.id] = getFieldNameErrorMessage(err)
            }
            if (Object.keys(errors).length > 0) { showToast(Object.values(errors).join(", ")); return }
            // Save all edits
            const updated = node.fields.map((f) => {
                const edit = localEdits[f.id]
                return edit ? { ...f, name: edit.name, dataType: edit.dataType } : f
            })
            updateNodeData(id, { node: { ...node, fields: updated } })
            setEditingFieldIds([])
            setLocalEdits({})
        } else {
            // Enter edit-all mode
            populateEdits(node.fields)
            setEditingFieldIds(node.fields.map((f) => f.id))
        }
    }

    // --- click-outside discards unsaved new fields ---
    useEffect(() => {
        if (!hasNewField) return
        const handler = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (mainDivRef.current?.contains(target)) return
            if (target.closest(".schema-node-toolbar")) return
            updateNodeData(id, {
                node: { ...node, fields: node.fields.filter((f) => !newFieldIds.includes(f.id)) },
            })
            setEditingFieldIds((prev) => prev.filter((fid) => !newFieldIds.includes(fid)))
            setNewFieldIds([])
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [hasNewField, id, node, newFieldIds, updateNodeData])

    const isEditAllMode = hasEdits && !hasNewField
    const editBtnLabel = isEditAllMode ? "Save" : "Edit"

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
                            <div><i className="codicon codicon-add-small"></i></div>
                            <div className="text-holder"><p className="button-text">Add Field</p></div>
                        </VsButton>
                    </div>
                    {!hasNewField && (
                        <div className="schema-node-button ">
                            <VsButton className="text-icon-reveal" onClick={handleEditOrSaveAll}>
                                <div><i className={'codicon codicon-' + (isEditAllMode ? "save" : "edit")}></i></div>
                                <div className="text-holder"><p className="button-text">{editBtnLabel}</p></div>
                            </VsButton>
                        </div>
                    )}
                    <div className="schema-node-button ">
                        <VsButton className="text-icon-reveal">
                            <div><ExpandIcon width={16} height={19} /></div>
                            <div className="text-holder"><p className="button-text">Expand</p></div>
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
                                    {editingName ? (
                                        <SchemaNodeComponentEditInput
                                            autoFocus
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") { saveNodeName(); }
                                                if (e.key === "Escape") { setName(node.label); setEditingName(false); }
                                            }}
                                        />
                                    ) : (
                                        <h4
                                            className="schema-label-text"
                                            onDoubleClick={() => { setName(node.label); setEditingName(true); }}
                                        >
                                            {node.label}
                                        </h4>
                                    )}
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
                            const isNew = newFieldIds.includes(field.id)
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
                                                        onKeyDown={(e) => { if (e.key === "Enter") { if (isNew) { handleSaveSingleField(field.id); } else { handleEditOrSaveAll(); } } }}
                                                    />
                                                </div>
                                                <div className="schema-data-type-field-label-type">
                                                    <SchemaNodeComponentEditSelect
                                                        value={edit.dataType}
                                                        onChange={(e) => updateLocalDataType(field.id, e.target.value as FieldDataType)}
                                                    >
                                                        {DATA_TYPES.map((dt) => (<option key={dt} value={dt}>{dt}</option>))}
                                                    </SchemaNodeComponentEditSelect>
                                                </div>
                                                    <div className="flex field-buttons-holder "> 
                                                        {
                                                            isNew &&(
                                                                 <div className="schema-node-button ">
                                                            <VsButton title="save" onClick={() => handleSaveSingleField(field.id)}>
                                                                <div><i className="codicon codicon-save"></i></div>
                                                            </VsButton>
                                                        </div>

                                                            )
                                                        }
                                                       
                                                        <div className="schema-node-button ">
                                                            <VsButton title="delete" className="delete-button" onClick={() => handleDeleteField(field.id)}>
                                                                <i className="codicon codicon-trash"></i>
                                                            </VsButton>
                                                        </div>
                                                    </div>
                                            </div>
                                        ) : (
                                            <div className="schema-data-type-field-item">
                                                <div className="schema-data-type-field-label">
                                                    <div><p className="schema-data-type-field-text">{field.name}</p></div>
                                                </div>
                                                <div className="schema-data-type-field-label-type">
                                                    <div><p className="schema-data-type-field-text schema-data-type-field-data-type">{field.dataType}</p></div>
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