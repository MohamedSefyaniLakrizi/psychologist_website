import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  QuoteIcon,
  TextIcon,
} from "lucide-react";

export const blockTypeToBlockName: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  paragraph: {
    label: "Paragraphe",
    icon: <TextIcon className="size-4" />,
  },
  h1: {
    label: "Titre 1",
    icon: <Heading1Icon className="size-4" />,
  },
  h2: {
    label: "Titre 2",
    icon: <Heading2Icon className="size-4" />,
  },
  h3: {
    label: "Titre 3",
    icon: <Heading3Icon className="size-4" />,
  },
  number: {
    label: "Liste numérotée",
    icon: <ListOrderedIcon className="size-4" />,
  },
  bullet: {
    label: "Liste à puces",
    icon: <ListIcon className="size-4" />,
  },
  check: {
    label: "Liste de contrôle",
    icon: <ListTodoIcon className="size-4" />,
  },
  code: {
    label: "Bloc de code",
    icon: <CodeIcon className="size-4" />,
  },
  quote: {
    label: "Citation",
    icon: <QuoteIcon className="size-4" />,
  },
};
