import { useAppPack } from "../../contexts/AppPackGateway";
import { Dropdown, DropdownItem } from "../../ui/Dropdown/Dropdown";
import "./AppPackSwitcher.css";

const ChevronDownIcon = () => (
	<svg
		width="14"
		height="14"
		role="img"
		aria-label="expand"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
);

const CheckIcon = () => (
	<svg
		width="14"
		height="14"
		role="img"
		aria-label="check"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="20 6 9 17 4 12" />
	</svg>
);

export function AppPackSwitcher() {
	const { packId, packMeta, availablePacks, switchPack } = useAppPack();

	// Don't show if only one pack or none
	if (availablePacks.length <= 1) {
		if (packMeta) {
			return (
				<div className="apppack-switcher__single">
					<span className="apppack-switcher__icon">
						{packMeta.icon || "📦"}
					</span>
					<span className="apppack-switcher__name">{packMeta.displayName}</span>
				</div>
			);
		}
		return null;
	}

	return (
		<Dropdown
			trigger={
				<button type="button" className="apppack-switcher__trigger">
					<span className="apppack-switcher__icon">
						{packMeta?.icon || "📦"}
					</span>
					<span className="apppack-switcher__name">
						{packMeta?.displayName || "AppPack"}
					</span>
					<ChevronDownIcon />
				</button>
			}
			placement="bottom-start"
		>
			{availablePacks.map((pack) => (
				<DropdownItem
					key={pack.packId}
					onClick={() => switchPack(pack.packId)}
					icon={
						packId === pack.packId ? (
							<CheckIcon />
						) : (
							<span style={{ width: 14 }} />
						)
					}
				>
					<span>
						{pack.icon || "📦"} {pack.displayName}
					</span>
				</DropdownItem>
			))}
		</Dropdown>
	);
}
