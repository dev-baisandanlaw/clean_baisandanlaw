import {
  Card,
  CardProps,
  CardSection,
  CardSectionProps,
  Group,
  Text,
} from "@mantine/core";
import { ReactNode } from "react";

interface BasicCardProps extends Omit<CardProps, "children"> {
  children: ReactNode;
  title?: string;
  headerProps?: CardSectionProps;
  bodyProps?: CardSectionProps;
  containerProps?: CardProps;
  actionButton?: ReactNode;
}

const BasicCard = ({
  children,
  title,
  headerProps,
  bodyProps,
  containerProps,
  actionButton,
}: BasicCardProps) => {
  return (
    <Card
      shadow="none"
      padding="none"
      radius="md"
      p="none"
      withBorder
      {...containerProps}
    >
      <CardSection withBorder p="sm" bg="gray.0" {...headerProps}>
        <Group justify="space-between">
          <Text fz="sm" fw={700} c="green">
            {title}
          </Text>
          {actionButton && actionButton}
        </Group>
      </CardSection>
      <CardSection p="sm" {...bodyProps}>
        {children}
      </CardSection>
    </Card>
  );
};

export default BasicCard;
