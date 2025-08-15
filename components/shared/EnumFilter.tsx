import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {toast} from "sonner"
import {z} from "zod"
import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import {Controller, type Control, type FieldValues, type Path} from "react-hook-form";
import {type EnumType} from "@/types/generic";
import {enumValues, asEnum} from "@/lib/utils";
import {RolePosition} from "@/models/User";

export type EnumFilterProps<
    TFieldValues extends FieldValues,
    TEnum extends string
> = {
    control?: Control<TFieldValues>;
    name: Path<TFieldValues>;
    options: EnumType<TEnum>;
    disabled?: boolean;
    clearable?: boolean;    // show a "None" option that sets the field to null
    className?: string;
    setFilters?: (selectedItems: string[]) => void;
    selectedFilters?: string[]; // current selected filters
}

const FormSchema = z.object({
    selectedItems: z.array(z.string())
});

export default function EnumFilter<
    TFieldValues extends FieldValues,
    TEnum extends string
>({
      name,
      control,
      options,
      disabled = false,
      clearable,
      className,
      setFilters,
      selectedFilters,
  }: EnumFilterProps<TFieldValues, TEnum>) {
    const allowed = enumValues(options);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            selectedItems: [],
        },
    });

    function clearFilters() {
        if (clearable || clearable === undefined) {
            form.reset({selectedItems: []});
            if (typeof setFilters === "function") {
                setFilters([]);
            }
        } else {
            toast.error("This filter cannot be cleared.");
        }
    }

    function onSubmit(data: z.infer<typeof FormSchema>) {
        if (typeof setFilters === "function") {
            setFilters(data.selectedItems);
        }
    }

    return (
        <>
            <h1 className="text-lg font-bold">{name}</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex gap-4">
                        <FormField
                            control={form.control}
                            name="selectedItems"
                            render={() => (
                                <FormItem className="sm:my-auto grid grid-cols-5">
                                    {allowed.map((item) => (
                                        <FormField
                                            key={item}
                                            control={form.control}
                                            name="selectedItems"
                                            render={({field}) => {
                                                return (
                                                    <FormItem
                                                        key={item}
                                                        className="flex flex-row items-center gap-2"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, item])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== item
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-normal">
                                                            {item}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={disabled}>Apply</Button>
                        <Button type="button" onClick={clearFilters}>Clear Filter</Button>
                    </div>
                </form>
            </Form>
        </>
    );
}