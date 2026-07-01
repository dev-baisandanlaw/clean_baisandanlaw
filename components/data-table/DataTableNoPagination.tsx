/* eslint-disable */
"use client";

import classes from "./TableScroll.module.css";
import { Center, Paper, Progress, Stack, Table, Text } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
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
  maxHeight?: string | number;
  loading?: boolean;
}

const DataTableNoPagination = <TData,>({
  columns,
  data,
  addListingButton,
  emptyText = "No data found.",
  maxHeight = "40vh",
  loading = false,
}: DataTableNoPaginationProps<TData>) => {
  const [theadRef, theadRect] = useResizeObserver<HTMLTableSectionElement>();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Stack>
      <Paper p={0} style={{ overflow: "hidden" }} radius={6} withBorder>
        {loading && (
          <Progress
            value={100}
            animated
            color="green"
            size="md"
            radius={0}
            striped
          />
        )}
        <Table.ScrollContainer
          minWidth={500}
          mb={-12}
          maxHeight={maxHeight}
          type="scrollarea"
          style={
            {
              "--header-height": `${theadRect.height}px`,
            } as React.CSSProperties
          }
          scrollAreaProps={{
            offsetScrollbars: "x",
            classNames: { scrollbar: classes.scrollbar },
          }}
        >
          <Table
            highlightOnHover={false}
            pb={0}
            stickyHeader
            stickyHeaderOffset={0}
          >
            <Table.Thead ref={theadRef}>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id} bg="gray.3">
                  {headerGroup.headers.map((header) => (
                    <Table.Th key={header.id} p="sm" bg="gray.3" c="green">
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
                          p="sm"
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
