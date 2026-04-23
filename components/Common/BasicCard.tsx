import {
  Card,
  CardProps,
  CardSection,
  CardSectionProps,
  Text,
} from "@mantine/core";
import { ReactNode } from "react";

interface BasicCardProps extends Omit<CardProps, "children"> {
  children: ReactNode;
  title?: string;
  headerProps?: CardSectionProps;
  bodyProps?: CardSectionProps;
}

const BasicCard = ({
  children,
  title,
  headerProps,
  bodyProps,
}: BasicCardProps) => {
  return (
    <Card shadow="none" padding="none" radius="md" p="none" withBorder>
      <CardSection withBorder p="md" bg="gray.0" {...headerProps}>
        <Text fz="sm" fw={700}>
          {title}
        </Text>
      </CardSection>
      <CardSection p="md" {...bodyProps}>
        {children}
      </CardSection>
    </Card>
  );
};

export default BasicCard;
