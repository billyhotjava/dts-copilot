import { render, screen } from "@testing-library/react";
import { DataTable } from "./DataTable";

describe("DataTable", () => {
	const sampleCols = [
		{ name: "id", display_name: "ID" },
		{ name: "name", display_name: "名称" },
		{ name: "amount", display_name: "金额" },
	];

	const sampleRows = [
		[1, "项目A", 1000],
		[2, "项目B", 2000],
		[3, "项目C", 3000],
	];

	it("渲染表头和数据行", () => {
		render(<DataTable cols={sampleCols} rows={sampleRows} />);
		expect(screen.getByText("ID")).toBeInTheDocument();
		expect(screen.getByText("名称")).toBeInTheDocument();
		expect(screen.getByText("金额")).toBeInTheDocument();
		expect(screen.getByText("项目A")).toBeInTheDocument();
		expect(screen.getByText("项目B")).toBeInTheDocument();
		expect(screen.getByText("项目C")).toBeInTheDocument();
	});

	it("空数据显示无数据提示", () => {
		render(<DataTable cols={sampleCols} rows={[]} />);
		expect(screen.getByText("No rows to display")).toBeInTheDocument();
	});

	it("数据量超过 pageSize 时显示分页", () => {
		// Create 5 rows with pageSize=2, should show pagination
		const manyRows = Array.from({ length: 5 }, (_, i) => [i + 1, `项目${i + 1}`, (i + 1) * 100]);
		render(<DataTable cols={sampleCols} rows={manyRows} pageSize={2} />);
		expect(screen.getByText("5 rows")).toBeInTheDocument();
		expect(screen.getByText("1 / 3")).toBeInTheDocument();
		expect(screen.getByText("Next")).toBeInTheDocument();
		expect(screen.getByText("Prev")).toBeInTheDocument();
	});

	it("数据量不超过 pageSize 时不显示分页", () => {
		render(<DataTable cols={sampleCols} rows={sampleRows} pageSize={50} />);
		expect(screen.queryByText("Next")).not.toBeInTheDocument();
	});

	it("使用 display_name 作为列标题，没有时使用 name", () => {
		const cols = [
			{ name: "col_a" },
			{ name: "col_b", display_name: "自定义名称" },
		];
		render(<DataTable cols={cols} rows={[["a", "b"]]} />);
		expect(screen.getByText("col_a")).toBeInTheDocument();
		expect(screen.getByText("自定义名称")).toBeInTheDocument();
	});
});
