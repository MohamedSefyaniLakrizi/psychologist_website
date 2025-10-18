"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent } from "@lexical/utils";
import React, { useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Palette,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LinkPlugin } from "./link-plugin";

const LowPriority = 1;

const blockTypeToBlockName = {
  h1: "Titre 1",
  h2: "Titre 2",
  h3: "Titre 3",
  h4: "Titre 4",
  h5: "Titre 5",
  h6: "Titre 6",
  paragraph: "Normal",
};

function BlockFormatDropDown({
  editor,
  blockType,
}: {
  editor: any;
  blockType: keyof typeof blockTypeToBlockName;
}) {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  return (
    <Select
      value={blockType}
      onValueChange={(value) => {
        switch (value) {
          case "paragraph":
            formatParagraph();
            break;
          case "h1":
            formatHeading("h1");
            break;
          case "h2":
            formatHeading("h2");
            break;
          case "h3":
            formatHeading("h3");
            break;
        }

        // Auto-focus the editor after format selection
        setTimeout(() => {
          editor.focus();
        }, 100);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectTrigger className="w-auto min-w-32 h-8 text-sm">
            <div className="flex items-center gap-2">
              <SelectValue />
            </div>
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Format de titre</p>
        </TooltipContent>
      </Tooltip>
      <SelectContent>
        <SelectItem value="paragraph" className="flex items-center gap-2">
          <div className="flex items-center gap-2 w-full">
            <Type className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Normal</span>
          </div>
        </SelectItem>
        <SelectItem value="h1" className="flex items-center gap-2">
          <div className="flex items-center gap-2 w-full">
            <Heading1 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl font-bold">Titre 1</span>
          </div>
        </SelectItem>
        <SelectItem value="h2" className="flex items-center gap-2">
          <div className="flex items-center gap-2 w-full">
            <Heading2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-semibold">Titre 2</span>
          </div>
        </SelectItem>
        <SelectItem value="h3" className="flex items-center gap-2">
          <div className="flex items-center gap-2 w-full">
            <Heading3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-base font-medium">Titre 3</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Helvetica, sans-serif");
  const [fontColor, setFontColor] = useState("#000000");
  const [bulletListStyle, setBulletListStyle] = useState<
    "disc" | "circle" | "square"
  >("disc");
  const [numberedListStyle, setNumberedListStyle] = useState<
    "decimal" | "lower-alpha" | "lower-roman"
  >("decimal");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && parent.isShadowRoot();
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      // Update font styles
      const currentFontSize = $getSelectionStyleValueForProperty(
        selection,
        "font-size",
        "16px"
      );
      const currentFontFamily = $getSelectionStyleValueForProperty(
        selection,
        "font-family",
        "Helvetica, sans-serif"
      );
      const currentColor = $getSelectionStyleValueForProperty(
        selection,
        "color",
        "#000000"
      );

      setFontSize(parseInt(currentFontSize) || 16);
      setFontFamily(currentFontFamily);
      setFontColor(currentColor);

      // Update links
      const node = selection.anchor.getNode();
      const parent = node.getParent();

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const listType = element.getListType();
          setIsBulletList(listType === "bullet");
          setIsNumberedList(listType === "number");
          setIsQuote(false);
          setBlockType("paragraph"); // Keep dropdown as paragraph for lists

          // Detect current list style from DOM
          const listStyle = elementDOM.style.listStyleType;
          if (listType === "bullet" && listStyle) {
            if (["disc", "circle", "square"].includes(listStyle)) {
              setBulletListStyle(listStyle as "disc" | "circle" | "square");
            }
          } else if (listType === "number" && listStyle) {
            if (["decimal", "lower-alpha", "lower-roman"].includes(listStyle)) {
              setNumberedListStyle(
                listStyle as "decimal" | "lower-alpha" | "lower-roman"
              );
            }
          }
        } else {
          setIsBulletList(false);
          setIsNumberedList(false);

          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();

          if (type === "quote") {
            setIsQuote(true);
            setBlockType("paragraph"); // Keep dropdown as paragraph for quotes
          } else {
            setIsQuote(false);
            if (type in blockTypeToBlockName) {
              setBlockType(type as keyof typeof blockTypeToBlockName);
            }
          }
        }
      }
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      LowPriority
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent min-w-0">
        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
              }}
              disabled={!canUndo}
              aria-label="Annuler"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Annuler (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                activeEditor.dispatchCommand(REDO_COMMAND, undefined);
              }}
              disabled={!canRedo}
              aria-label="Rétablir"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rétablir (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Block Type */}
        <BlockFormatDropDown editor={activeEditor} blockType={blockType} />

        <Separator orientation="vertical" className="h-6" />

        {/* Text Formatting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
              }}
              className={cn(isBold && "bg-accent")}
              aria-label="Gras"
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gras (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
              }}
              className={cn(isItalic && "bg-accent")}
              aria-label="Italique"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italique (Ctrl+I)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
              }}
              className={cn(isUnderline && "bg-accent")}
              aria-label="Souligné"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Souligner (Ctrl+U)</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                activeEditor.dispatchCommand(
                  FORMAT_TEXT_COMMAND,
                  "strikethrough"
                );
              }}
              className={cn(isStrikethrough && "bg-accent")}
              aria-label="Barré"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Barrer</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Font Formatting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center border rounded h-8">
              <Button
                variant="ghost"
                size="sm"
                className="h-full px-2 rounded-none border-r"
                onClick={() => {
                  const newSize = Math.max(8, fontSize - 2);
                  activeEditor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      $patchStyleText(selection, {
                        "font-size": `${newSize}px`,
                      });
                    }
                  });
                  setFontSize(newSize);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value) || 16;
                  if (newSize >= 8 && newSize <= 72) {
                    activeEditor.update(() => {
                      const selection = $getSelection();
                      if ($isRangeSelection(selection)) {
                        $patchStyleText(selection, {
                          "font-size": `${newSize}px`,
                        });
                      }
                    });
                    setFontSize(newSize);
                  }
                }}
                className="w-12 h-full text-center border-0 focus:ring-0 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                min="8"
                max="72"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-full px-2 rounded-none border-l"
                onClick={() => {
                  const newSize = Math.min(72, fontSize + 2);
                  activeEditor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      $patchStyleText(selection, {
                        "font-size": `${newSize}px`,
                      });
                    }
                  });
                  setFontSize(newSize);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Taille de police</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        <Select
          value={fontFamily}
          onValueChange={(value) => {
            activeEditor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $patchStyleText(selection, { "font-family": value });
              }
            });
            setFontFamily(value);
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectTrigger
                className="w-32 h-8 text-sm"
                style={{ fontFamily: fontFamily }}
              >
                <SelectValue />
              </SelectTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Police de caractères</p>
            </TooltipContent>
          </Tooltip>
          <SelectContent>
            <SelectItem
              value="Helvetica, sans-serif"
              style={{ fontFamily: "Helvetica, sans-serif" }}
            >
              Helvetica
            </SelectItem>
            <SelectItem
              value="Arial, sans-serif"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Arial
            </SelectItem>
            <SelectItem
              value="Georgia, serif"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Georgia
            </SelectItem>
            <SelectItem
              value="Times New Roman, serif"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              Times New Roman
            </SelectItem>
            <SelectItem
              value="Courier New, monospace"
              style={{ fontFamily: "Courier New, monospace" }}
            >
              Courier New
            </SelectItem>
            <SelectItem
              value="Verdana, sans-serif"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              Verdana
            </SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Couleur du texte">
                  <Palette className="h-4 w-4" />
                  <div
                    className="w-3 h-1 mt-1 rounded"
                    style={{ backgroundColor: fontColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="grid grid-cols-10 gap-1">
                  {(() => {
                    const baseColors = [
                      "#000000", // Black
                      "#ff0000", // Red
                      "#ff8000", // Orange
                      "#ffff00", // Yellow
                      "#80ff00", // Yellow-Green
                      "#00ff00", // Green
                      "#00ff80", // Green-Cyan
                      "#00ffff", // Cyan
                      "#0080ff", // Cyan-Blue
                      "#0000ff", // Blue
                      "#8000ff", // Blue-Purple
                      "#ff00ff", // Purple
                      "#ff0080", // Purple-Red
                    ];

                    const colors: string[] = [];
                    // Add pure colors first row
                    baseColors.forEach((color) => colors.push(color));

                    // Add lighter shades
                    baseColors.forEach((color) => {
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      const lightR = Math.min(
                        255,
                        Math.round(r + (255 - r) * 0.3)
                      );
                      const lightG = Math.min(
                        255,
                        Math.round(g + (255 - g) * 0.3)
                      );
                      const lightB = Math.min(
                        255,
                        Math.round(b + (255 - b) * 0.3)
                      );
                      colors.push(
                        `#${lightR.toString(16).padStart(2, "0")}${lightG
                          .toString(16)
                          .padStart(2, "0")}${lightB
                          .toString(16)
                          .padStart(2, "0")}`
                      );
                    });

                    // Add even lighter shades
                    baseColors.forEach((color) => {
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      const lightR = Math.min(
                        255,
                        Math.round(r + (255 - r) * 0.6)
                      );
                      const lightG = Math.min(
                        255,
                        Math.round(g + (255 - g) * 0.6)
                      );
                      const lightB = Math.min(
                        255,
                        Math.round(b + (255 - b) * 0.6)
                      );
                      colors.push(
                        `#${lightR.toString(16).padStart(2, "0")}${lightG
                          .toString(16)
                          .padStart(2, "0")}${lightB
                          .toString(16)
                          .padStart(2, "0")}`
                      );
                    });

                    // Add darker shades
                    baseColors.forEach((color) => {
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      const darkR = Math.round(r * 0.7);
                      const darkG = Math.round(g * 0.7);
                      const darkB = Math.round(b * 0.7);
                      colors.push(
                        `#${darkR.toString(16).padStart(2, "0")}${darkG
                          .toString(16)
                          .padStart(2, "0")}${darkB
                          .toString(16)
                          .padStart(2, "0")}`
                      );
                    });

                    // Add very dark shades
                    baseColors.forEach((color) => {
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      const darkR = Math.round(r * 0.4);
                      const darkG = Math.round(g * 0.4);
                      const darkB = Math.round(b * 0.4);
                      colors.push(
                        `#${darkR.toString(16).padStart(2, "0")}${darkG
                          .toString(16)
                          .padStart(2, "0")}${darkB
                          .toString(16)
                          .padStart(2, "0")}`
                      );
                    });

                    return colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          activeEditor.update(() => {
                            const selection = $getSelection();
                            if ($isRangeSelection(selection)) {
                              $patchStyleText(selection, { color });
                            }
                          });
                          setFontColor(color);
                        }}
                      />
                    ));
                  })()}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      activeEditor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          $patchStyleText(selection, { color });
                        }
                      });
                      setFontColor(color);
                    }}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      activeEditor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          $patchStyleText(selection, { color: "#000000" });
                        }
                      });
                      setFontColor("#000000");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent>
            <p>Couleur du texte</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists and Quote - separate toolbar buttons */}
        <div className="flex items-center border rounded overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isBulletList) {
                    activeEditor.dispatchCommand(
                      INSERT_UNORDERED_LIST_COMMAND,
                      undefined
                    );
                    // Apply current bullet style
                    setTimeout(() => {
                      activeEditor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          const listNode = $findMatchingParent(
                            selection.anchor.getNode(),
                            $isListNode
                          );
                          if (listNode instanceof ListNode) {
                            const domElement = activeEditor.getElementByKey(
                              listNode.getKey()
                            );
                            if (domElement) {
                              domElement.style.listStyleType = bulletListStyle;
                              domElement.style.paddingLeft = "20px";
                            }
                          }
                        }
                      });
                    }, 100);
                  } else {
                    activeEditor.dispatchCommand(
                      REMOVE_LIST_COMMAND,
                      undefined
                    );
                  }
                }}
                className={cn(
                  isBulletList && "bg-accent",
                  "rounded-none border-0 border-r h-8"
                )}
                aria-label="Liste à puces"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Liste à puces</p>
            </TooltipContent>
          </Tooltip>

          <Select
            value={bulletListStyle}
            onValueChange={(value: "disc" | "circle" | "square") => {
              setBulletListStyle(value);
              if (isBulletList) {
                activeEditor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const listNode = $findMatchingParent(
                      selection.anchor.getNode(),
                      $isListNode
                    );
                    if (listNode instanceof ListNode) {
                      const domElement = activeEditor.getElementByKey(
                        listNode.getKey()
                      );
                      if (domElement) {
                        domElement.style.listStyleType = value;
                      }
                    }
                  }
                });
              }
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-3 p-0 h-8 rounded-none border-0 focus:ring-0">
                  <ChevronDown className="!h-3 !w-3" />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Style de puce</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent>
              <SelectItem value="disc">● Disque</SelectItem>
              <SelectItem value="circle">○ Cercle</SelectItem>
              <SelectItem value="square">■ Carré</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center border rounded overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isNumberedList) {
                    activeEditor.dispatchCommand(
                      INSERT_ORDERED_LIST_COMMAND,
                      undefined
                    );
                    // Apply current numbering style
                    setTimeout(() => {
                      activeEditor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          const listNode = $findMatchingParent(
                            selection.anchor.getNode(),
                            $isListNode
                          );
                          if (listNode instanceof ListNode) {
                            const domElement = activeEditor.getElementByKey(
                              listNode.getKey()
                            );
                            if (domElement) {
                              domElement.style.listStyleType =
                                numberedListStyle;
                              domElement.style.paddingLeft = "20px";
                            }
                          }
                        }
                      });
                    }, 100);
                  } else {
                    activeEditor.dispatchCommand(
                      REMOVE_LIST_COMMAND,
                      undefined
                    );
                  }
                }}
                className={cn(
                  isNumberedList && "bg-accent",
                  "rounded-none border-0 border-r h-8"
                )}
                aria-label="Liste numérotée"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Liste numérotée</p>
            </TooltipContent>
          </Tooltip>

          <Select
            value={numberedListStyle}
            onValueChange={(
              value: "decimal" | "lower-alpha" | "lower-roman"
            ) => {
              setNumberedListStyle(value);
              if (isNumberedList) {
                activeEditor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const listNode = $findMatchingParent(
                      selection.anchor.getNode(),
                      $isListNode
                    );
                    if (listNode instanceof ListNode) {
                      const domElement = activeEditor.getElementByKey(
                        listNode.getKey()
                      );
                      if (domElement) {
                        domElement.style.listStyleType = value;
                      }
                    }
                  }
                });
              }
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-3 p-0 h-8 rounded-none border-0 focus:ring-0">
                  <ChevronDown className="!h-3 !w-3" />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Style de numérotation</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent>
              <SelectItem value="decimal">1. Nombres</SelectItem>
              <SelectItem value="lower-alpha">a. Lettres</SelectItem>
              <SelectItem value="lower-roman">i. Romain</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!isQuote) {
                  activeEditor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      $setBlocksType(selection, () => $createQuoteNode());
                    }
                  });
                } else {
                  activeEditor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      $setBlocksType(selection, () => $createParagraphNode());
                    }
                  });
                }
              }}
              className={cn(isQuote && "bg-accent")}
              aria-label="Citation"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Citation</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <LinkPlugin />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insérer un lien</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// Utility function from Lexical
function mergeRegister(...args: Array<() => void>): () => void {
  return () => {
    args.forEach((cleanup) => cleanup());
  };
}
