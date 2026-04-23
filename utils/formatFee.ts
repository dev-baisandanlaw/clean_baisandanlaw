export const formatFee = (fee: number) => {
  return `₱${fee.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
