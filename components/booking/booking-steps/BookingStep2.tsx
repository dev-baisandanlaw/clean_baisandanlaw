import BasicCard from "@/components/Common/BasicCard";
import { Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { BookingFormTypeValues } from "../RevampedBookingModal";
import DetailField from "@/components/Common/DetailField";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "@/components/Common/BadgeComp";
import SpoilerComp from "@/components/Common/SpoilerComp";

export default function BookingStepTwo({
  form,
}: {
  form: UseFormReturnType<BookingFormTypeValues>;
}) {
  const values = form.values;
  const areas = values.areas ?? [];
  const displayedAreas = areas.slice(0, 3);
  const remainingAreasCount = areas.length - displayedAreas.length;

  return (
    <Stack>
      <Text fw={600}>Booking Summary</Text>{" "}
      <BasicCard title="Basic Information">
        <SimpleGrid cols={2} mb="md">
          <DetailField title="First name" value={values.firstname} />
          <DetailField title="Last name" value={values.lastname} />
          <DetailField title="Email" value={values.email} />
          <DetailField title="Phone" value={"+63 " + values.phone} />
          <DetailField
            title="Birthdate"
            value={getDateFormatDisplay(values.birthday!)}
          />
          <DetailField title="Adverse Party" value={values.adverseParty} />
        </SimpleGrid>
        <DetailField title="Full address" value={values.fullAddress} />
      </BasicCard>
      <BasicCard title="Appointment Information">
        <SimpleGrid cols={2} mb="md">
          <DetailField
            title="Consultation Type"
            value={values.consultationType}
          />
          <DetailField
            title="Branch"
            value={values.consultationType === "online" ? "-" : values.branch}
          />
          <DetailField
            title="Areas"
            value={
              <Group gap={2} wrap="wrap">
                {displayedAreas.map((a) => (
                  <AreaBadge key={a} area={a} />
                ))}

                {remainingAreasCount > 0 && (
                  <AreaBadge area={`+ ${remainingAreasCount}`} />
                )}
              </Group>
            }
          />
          <DetailField
            title="Rep. by previous lawyer?"
            value={values.representedByPreviousLawyer ? "Yes" : "No"}
          />
        </SimpleGrid>
        <DetailField
          title="Message"
          value={<SpoilerComp>{values?.message}</SpoilerComp>}
        />
      </BasicCard>
    </Stack>
  );
}
