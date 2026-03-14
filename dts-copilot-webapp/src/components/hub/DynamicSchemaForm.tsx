import { DatePicker, InputNumber } from "antd";
import { useState } from "react";
import "./DynamicSchemaForm.css";

interface SchemaField {
	name: string;
	type: string;
	label: string;
	required?: boolean;
	enum?: string[];
	description?: string;
}

interface Props {
	schema: Record<string, unknown>;
	values: Record<string, unknown>;
	onChange: (values: Record<string, unknown>) => void;
}

function extractFields(schema: Record<string, unknown>): SchemaField[] {
	const props = (schema.properties ?? {}) as Record<
		string,
		Record<string, unknown>
	>;
	const required = ((schema.required ?? []) as string[]) || [];

	return Object.entries(props).map(([name, def]) => ({
		name,
		type: (def.type as string) ?? "string",
		label: (def.title as string) ?? (def.label as string) ?? name,
		required: required.includes(name),
		enum: def.enum as string[] | undefined,
		description: def.description as string | undefined,
	}));
}

export function DynamicSchemaForm({ schema, values, onChange }: Props) {
	const fields = extractFields(schema);
	const [localValues, setLocalValues] =
		useState<Record<string, unknown>>(values);

	function updateField(name: string, value: unknown) {
		const next = { ...localValues, [name]: value };
		setLocalValues(next);
		onChange(next);
	}

	if (fields.length === 0) {
		return (
			<div className="dsf-empty">No parameters required for this action.</div>
		);
	}

	return (
		<div className="dsf-form">
			{fields.map((field) => (
				<div key={field.name} className="dsf-field">
					<label className="dsf-label" htmlFor={`dsf-${field.name}`}>
						{field.label}
						{field.required && <span className="dsf-required">*</span>}
					</label>
					{field.description && (
						<div className="dsf-hint">{field.description}</div>
					)}
					{renderField(field, localValues[field.name], (v) =>
						updateField(field.name, v),
					)}
				</div>
			))}
		</div>
	);
}

function renderField(
	field: SchemaField,
	value: unknown,
	onChange: (v: unknown) => void,
) {
	const id = `dsf-${field.name}`;

	// Enum → custom select
	if (field.enum && field.enum.length > 0) {
		return (
			<select
				id={id}
				className="dsf-select"
				value={(value as string) ?? ""}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">--</option>
				{field.enum.map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
		);
	}

	// Number → antd InputNumber
	if (field.type === "number" || field.type === "integer") {
		return (
			<InputNumber
				id={id}
				className="dsf-number"
				value={value as number | undefined}
				onChange={(v) => onChange(v)}
				style={{ width: "100%" }}
			/>
		);
	}

	// Date → antd DatePicker
	if (field.type === "date" || field.name.toLowerCase().includes("date")) {
		return (
			<DatePicker
				id={id}
				className="dsf-date"
				onChange={(_date, dateString) => onChange(dateString)}
				style={{ width: "100%" }}
			/>
		);
	}

	// Boolean → checkbox
	if (field.type === "boolean") {
		return (
			<label className="dsf-checkbox-label" htmlFor={id}>
				<input
					id={id}
					type="checkbox"
					checked={!!value}
					onChange={(e) => onChange(e.target.checked)}
				/>
				{field.label}
			</label>
		);
	}

	// Default → custom text input
	return (
		<input
			id={id}
			className="dsf-input"
			type="text"
			value={(value as string) ?? ""}
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.label}
		/>
	);
}
