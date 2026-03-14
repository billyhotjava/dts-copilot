import { type FormEvent, useState } from "react";
import { SearchInput } from "../../ui/Input/Input";
import "./hub.css";

interface HubSearchBarProps {
	packId: string | null;
	onSearch: (q: string) => void;
	loading?: boolean;
}

export function HubSearchBar({
	packId,
	onSearch,
	loading = false,
}: HubSearchBarProps) {
	const [value, setValue] = useState("");

	const doSearch = () => {
		const q = value.trim();
		onSearch(q);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		doSearch();
	};

	return (
		<form className="hub-search-bar" onSubmit={handleSubmit}>
			<label htmlFor="hub-global-search" className="hub-search-bar__hint">
				{packId ? `当前 AppPack: ${packId}` : "未选择 AppPack"}
			</label>
			<div className="hub-search-bar__actions">
				<SearchInput
					id="hub-global-search"
					value={value}
					placeholder="按名称/外部ID搜索对象实例（仅当前 AppPack）"
					disabled={!packId || loading}
					onChange={(event) => setValue(event.target.value)}
					onClear={() => setValue("")}
					helperText={packId ? "回车执行搜索" : "请先选择 AppPack"}
				/>
			</div>
		</form>
	);
}
