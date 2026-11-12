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
  titleBadge?: ReactNode;
  headerProps?: CardSectionProps;
  bodyProps?: CardSectionProps;
  containerProps?: CardProps;
  actionButton?: ReactNode;
}

const BasicCard = ({
  children,
  title,
  titleBadge,
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
          <Group gap="xs">
            <Text fz="sm" fw={700} c="green">
              {title}
            </Text>
            {titleBadge}
          </Group>
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
