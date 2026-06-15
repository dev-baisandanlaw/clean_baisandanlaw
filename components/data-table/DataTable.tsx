/* eslint-disable */
"use client";

import type { GenericPaginatedResponse } from "@/types/pagination";
import {
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Progress,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

const INITIAL_PAGE = 1;

type UseQueryHook<TData> = (args: any) => {
  data?: GenericPaginatedResponse<TData>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  useQuery: UseQueryHook<TData>;
  queryArgs?: Record<string, any>;
  addListingButton?: React.ReactNode;
  emptyText?: string;
}

const DataTable = <TData,>({
  columns,
  useQuery,
  queryArgs,
  addListingButton,
  emptyText = "No data found.",
}: DataTableProps<TData>) => {
  const [page, setPage] = useState(INITIAL_PAGE);

  const { data, isLoading, isFetching, isError } = useQuery({
    page,
    limit: 25,
    ...queryArgs,
  });

  useEffect(() => {
    setPage(INITIAL_PAGE);
  }, [queryArgs]);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = data?.metadata?.totalPages ?? 0;

  if (isError) {
    return (
      <Center h={200}>
        <Text c="red">Something went wrong. Please try again.</Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Paper p={0} style={{ overflow: "hidden" }} radius={6} withBorder>
        {isFetching && (
          <Progress
            value={100}
            animated
            color="green"
            size="md"
            radius={0}
            striped
          />
        )}

        <Table.ScrollContainer minWidth={500} mb={-12}>
          <Table highlightOnHover={false} pb={0}>
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id} bg="gray.4">
                  {headerGroup.headers.map((header) => (
                    <Table.Th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>

            <Table.Tbody>
              {table.getRowModel().rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <Center h={200}>
                      <Text c="dimmed">{emptyText}</Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <Table.Tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Td
                          key={cell.id}
                          style={{
                            width: cell.column.columnDef.size
                              ? `${cell.column.columnDef.size}px`
                              : "auto",
                            minWidth: cell.column.columnDef.minSize
                              ? `${cell.column.columnDef.minSize}px`
                              : "auto",
                            maxWidth: cell.column.columnDef.maxSize
                              ? `${cell.column.columnDef.maxSize}px`
                              : "none",
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}

                  {addListingButton && (
                    <Table.Tr>
                      <Table.Td colSpan={columns.length}>
                        <Center>{addListingButton}</Center>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          {data && data?.metadata?.total > 0
            ? `Showing ${(page - 1) * data?.metadata?.limit + 1} – ${Math.min(page * data?.metadata?.limit, data?.metadata?.total)} of ${data?.metadata?.total}`
            : ""}
        </Text>
        <Pagination
          size="sm"
          total={totalPages}
          value={page}
          onChange={setPage}
          disabled={isLoading || isFetching}
        />
      </Group>
    </Stack>
  );
};

export default DataTable;
