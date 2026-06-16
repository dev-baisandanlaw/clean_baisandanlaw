/* eslint-disable */
"use client";

import { Center, Paper, Stack, Table, Text } from "@mantine/core";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

interface DataTableNoPaginationProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  addListingButton?: React.ReactNode;
  emptyText?: string;
}

const DataTableNoPagination = <TData,>({
  columns,
  data,
  addListingButton,
  emptyText = "No data found.",
}: DataTableNoPaginationProps<TData>) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Stack>
      <Paper p={0} style={{ overflow: "hidden" }} radius={6} withBorder>
        <Table.ScrollContainer minWidth={500} mb={-12}>
          <Table highlightOnHover={false} pb={0}>
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id} bg="gray.3">
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
    </Stack>
  );
};

export default DataTableNoPagination;
