import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

export interface ChartConfig {
	chartType: "line" | "bar" | "pie" | "area" | "scatter" | "column";
	title: string;
	xField: string;
	yField: string;
	seriesField?: string;
	data: Record<string, unknown>[];
	sql?: string;
	rowCount?: number;
}

interface Props {
	config: ChartConfig;
	height?: number;
}

export default function ChartPreview({ config, height = 400 }: Props) {
	const option = useMemo(() => buildEChartsOption(config), [config]);
	return <ReactECharts option={option} style={{ height, width: "100%" }} />;
}

function buildEChartsOption(config: ChartConfig): Record<string, unknown> {
	const { chartType, title, xField, yField, seriesField, data } = config;

	if (chartType === "pie") {
		return buildPieOption(title, xField, yField, data);
	}

	if (seriesField) {
		return buildSeriesOption(chartType, title, xField, yField, seriesField, data);
	}

	return buildSimpleOption(chartType, title, xField, yField, data);
}

function buildSimpleOption(
	chartType: string,
	title: string,
	xField: string,
	yField: string,
	data: Record<string, unknown>[],
) {
	const xData = data.map((d) => String(d[xField] ?? ""));
	const yData = data.map((d) => Number(d[yField] ?? 0));
	const seriesType = chartType === "column" ? "bar" : chartType === "area" ? "line" : chartType;

	return {
		title: { text: title, left: "center", textStyle: { fontSize: 14 } },
		tooltip: { trigger: "axis" },
		xAxis: { type: "category", data: xData },
		yAxis: { type: "value" },
		series: [
			{
				type: seriesType,
				data: yData,
				...(chartType === "area" ? { areaStyle: {} } : {}),
			},
		],
		grid: { left: 60, right: 20, bottom: 40, top: 50 },
	};
}

function buildSeriesOption(
	chartType: string,
	title: string,
	xField: string,
	yField: string,
	seriesField: string,
	data: Record<string, unknown>[],
) {
	const seriesNames = [...new Set(data.map((d) => String(d[seriesField] ?? "")))];
	const xValues = [...new Set(data.map((d) => String(d[xField] ?? "")))];
	const seriesType = chartType === "column" ? "bar" : chartType === "area" ? "line" : chartType;

	const series = seriesNames.map((name) => ({
		name,
		type: seriesType,
		data: xValues.map((x) => {
			const row = data.find((d) => String(d[xField]) === x && String(d[seriesField]) === name);
			return row ? Number(row[yField] ?? 0) : 0;
		}),
		...(chartType === "area" ? { areaStyle: {} } : {}),
	}));

	return {
		title: { text: title, left: "center", textStyle: { fontSize: 14 } },
		tooltip: { trigger: "axis" },
		legend: { top: 30, data: seriesNames },
		xAxis: { type: "category", data: xValues },
		yAxis: { type: "value" },
		series,
		grid: { left: 60, right: 20, bottom: 40, top: 60 },
	};
}

function buildPieOption(
	title: string,
	nameField: string,
	valueField: string,
	data: Record<string, unknown>[],
) {
	return {
		title: { text: title, left: "center", textStyle: { fontSize: 14 } },
		tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
		series: [
			{
				type: "pie",
				radius: "55%",
				data: data.map((d) => ({
					name: String(d[nameField] ?? ""),
					value: Number(d[valueField] ?? 0),
				})),
			},
		],
	};
}
