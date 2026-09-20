import { Copyable } from "@/components/common/Copyable";
import { Footer } from "@/components/common/footer";
import { IndexList } from "@/components/biz/IndexList";
import { DumpButton } from "@/components/biz/Dump";
import { InsFormModal } from "@/components/biz/InstanceFormModal";
import { LoaderPage } from "@/components/common/Loader";
import { TimeAgo } from "@/components/common/Timeago";
import { TitleWithUnderline } from "@/components/common/Title";
import { useCurrentInstance } from "@/hooks/useCurrentInstance";
import { useInstanceHealth } from "@/hooks/useInstanceHealth";
import { useInstanceStats } from "@/hooks/useInstanceStats";
import { useMeiliClient } from "@/hooks/useMeiliClient";
import { isSingletonMode } from "@/lib/conn";
import { Tooltip } from "@arco-design/web-react";
import { Descriptions, Skeleton, Tag } from "@douyinfe/semi-ui";
import { Button } from "@nextui-org/react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { filesize } from "filesize";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function InsDash() {
	const { t } = useTranslation("instance");
	const currentInstance = useCurrentInstance();
	const client = useMeiliClient();
	const [stats] = useInstanceStats(client);
	const isHealth = useInstanceHealth(client);

	const insDescriptionsData = useMemo(() => {
		return [
			{
				key: t("host"),
				value: <span data-testid="rb-ins-host" style={{ display: "contents" }}><Copyable>{currentInstance.host}</Copyable></span>,
			},
			{
				key: t("common:updated_at"),
				value: <span data-testid="rb-ins-updated-detail" style={{ display: "contents" }}><TimeAgo date={currentInstance.updatedTime} /></span>,
			},
			{
				key: t("db_size"),
				value: (
					<span data-testid="rb-ins-dbsize" style={{ display: "contents" }}>
						<Skeleton
							placeholder={<Skeleton.Title />}
							active
							loading={!stats?.databaseSize}
						>
							{filesize(stats?.databaseSize ?? 0)}
						</Skeleton>
					</span>
				),
			},
			{
				key: t("status.label"),
				value: isHealth ? (
					<span data-testid="rb-ins-status" style={{ display: "contents" }}><Tag color="green">{t("status.available")}</Tag></span>
				) : (
					<span data-testid="rb-ins-status" style={{ display: "contents" }}><Tag color="amber">{t("unknown")}</Tag></span>
				),
			},
			{
				key: t("version.label"),
				value: (
					<span data-testid="rb-ins-version" style={{ display: "contents" }}>
						<Skeleton
							placeholder={<Skeleton.Title />}
							active
							loading={!stats?.version}
						>
							<Tag>{stats?.version.pkgVersion}</Tag>
						</Skeleton>
					</span>
				),
			},
		];
	}, [
		currentInstance.host,
		currentInstance.updatedTime,
		isHealth,
		stats?.databaseSize,
		stats?.version,
		t,
	]);

	return (
		<div data-testid="rb-page-ins" className="flex-1 grid grid-cols-4 overflow-scroll">
			<main className="p-4 laptop:col-start-2 laptop:col-end-4 col-start-1 col-end-5 flex flex-col gap-4">
				{!isSingletonMode() && (
					<div className="flex flex-row gap-4 items-baseline">
						<span data-testid="rb-ins-title" style={{ display: "contents" }}><TitleWithUnderline>{`#${currentInstance.id} ${currentInstance.name}`}</TitleWithUnderline></span>
						<InsFormModal ins={currentInstance} type="edit">
							<Tooltip content={t("edit")} position="right" mini>
								<div className="i-lucide:edit w-1em h-1em cursor-pointer hover:scale-90 transition" />
							</Tooltip>
						</InsFormModal>
					</div>
				)}
				<div className="flex">
					<Descriptions
						className="flex-1"
						align="left"
						data={insDescriptionsData}
					/>
					<div className="flex flex-col gap-3 items-start">
						<Link to="keys" from="/ins/$insID">
							<Button variant="light" size="sm">
								<div className="i-lucide:key w-1em h-1em" /> {t("keys")}
							</Button>
						</Link>
						<Link to="tasks" from="/ins/$insID">
							<Button variant="light" size="sm">
								<div className="i-lucide:workflow w-1em h-1em" />
								{t("tasks")}
							</Button>
						</Link>
						<DumpButton />
					</div>
				</div>
				<IndexList client={client} />
			</main>
			<Footer className="col-span-full mt-auto mb-3" />
		</div>
	);
}

export const Route = createFileRoute("/ins/$insID/_layout/")({
	component: InsDash,
	pendingComponent: LoaderPage,
});
