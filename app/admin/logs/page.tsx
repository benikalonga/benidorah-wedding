'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/admin/ui/PageHeader';
import { Input, Select } from '@/components/admin/ui/form';
import Button from '@/components/admin/ui/Button';
import Badge from '@/components/admin/ui/Badge';
import Card from '@/components/admin/ui/Card';
import EmptyState from '@/components/admin/ui/EmptyState';
import Skeleton from '@/components/admin/ui/Skeleton';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/admin/ui/Table';
import { IconLogs, IconSearch } from '@/components/admin/ui/icons';

interface LogRow {
  id: string;
  guestId: string | null;
  guestName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface LogsResponse {
  logs: LogRow[];
  total: number;
  page: number;
  pageSize: number;
  actions: string[];
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) return '—';
  return Object.entries(metadata)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

export default function LogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  async function load(p: number, q: string, action: string) {
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set('q', q);
    if (action !== 'all') params.set('action', action);
    const res = await fetch(`/api/admin/logs?${params.toString()}`);
    if (res.ok) setData(await res.json());
  }

  // Reset to page 1 whenever the search/filter changes, and debounce the
  // free-text search so typing doesn't fire a request per keystroke — a
  // filter dropdown change is instant since there's no typing to debounce.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      load(1, query, actionFilter);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, actionFilter]);

  useEffect(() => {
    load(page, query, actionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Logs"
        subtitle="Every tracked visit and action on the public site — guest name when opened via a personal link, IP address otherwise."
        meta={
          data && (
            <span className="text-sm text-charcoal/55">
              <span className="font-semibold text-onyx">{data.total}</span> total
            </span>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm sm:flex-1">
          <IconSearch
            width={16}
            height={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40"
          />
          <Input
            placeholder="Search by name, IP, action, or path…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-auto min-w-[10rem]"
        >
          <option value="all">All actions</option>
          {data?.actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      {data === null ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data.logs.length === 0 ? (
        <EmptyState
          icon={<IconLogs width={40} height={40} />}
          title="No activity logged yet"
          description="Once visitors start browsing the site, their page views and clicks will show up here."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <Thead>
                <Tr>
                  <Th>Time</Th>
                  <Th>Visitor</Th>
                  <Th>Action</Th>
                  <Th>Path</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.logs.map((log) => (
                  <Tr key={log.id}>
                    <Td className="whitespace-nowrap text-charcoal/60">
                      {new Date(log.createdAt).toLocaleString()}
                    </Td>
                    <Td className="min-w-[10rem]">
                      {log.guestName ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="green">Guest</Badge>
                          <span className="font-medium">{log.guestName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">Unknown</Badge>
                          <span className="text-charcoal/60">{log.ipAddress || '—'}</span>
                        </div>
                      )}
                    </Td>
                    <Td>
                      <Badge tone="blue">{log.action}</Badge>
                    </Td>
                    <Td className="text-charcoal/60">{log.path || '—'}</Td>
                    <Td className="max-w-xs truncate text-charcoal/50" title={formatMetadata(log.metadata)}>
                      {formatMetadata(log.metadata)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {data.logs.map((log) => (
              <Card key={log.id} padded={false} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  {log.guestName ? (
                    <div className="flex items-center gap-2">
                      <Badge tone="green">Guest</Badge>
                      <span className="text-sm font-medium text-onyx">{log.guestName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">Unknown</Badge>
                      <span className="text-xs text-charcoal/60">{log.ipAddress || '—'}</span>
                    </div>
                  )}
                  <span className="shrink-0 text-[11px] text-charcoal/40">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone="blue">{log.action}</Badge>
                  {log.path && <span className="text-xs text-charcoal/50">{log.path}</span>}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <p className="mt-2 text-xs text-charcoal/50">{formatMetadata(log.metadata)}</p>
                )}
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-charcoal/50">
              Page {data.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
