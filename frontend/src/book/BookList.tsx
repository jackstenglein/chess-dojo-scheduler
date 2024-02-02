import { BookSummary, exportBook, importBook } from '@bendk/chess-tree'
import { downloadZip } from 'client-zip'
import React, { useCallback, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Button, Link, CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MenuIcon from '@mui/icons-material/Menu';
import { DataGridPro, GridColDef, GridEventListener, GridRenderCellParams, GridRowId, GridToolbarContainer, GridToolbarQuickFilter, useGridApiRef } from '@mui/x-data-grid-pro';
import { getBook, deleteBook, putBook } from '../api/bookApi';

interface BookListProps {
    bookList: BookSummary[];
    setBookList: (books: BookSummary[]) => void;
}

const BookList: React.FC<BookListProps> = ({bookList, setBookList}) => {
    const navigate = useNavigate()
    const gridApiRef = useGridApiRef();
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement|null>(null);
    const [selectionMode, setSelectionMode] = useState<string|null>(null)
    const [selection, setSelection] = useState<GridRowId[]>([])
    const [operationInProgress, setOperationInProgress] = useState<string|null>(null)
    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            renderCell: (params: GridRenderCellParams<any, string>) => (
                <Link
                    component={RouterLink}
                    to={`/book/books/${params.row.id}`}
                    underline="none"
                    >
                {params.value}
                </Link>
            )

        },
        {
            field: 'lineCount',
            headerName: 'Lines',
            valueGetter: (params) => params.row.lineCount,
            width: 200,
        },
        {
            field: 'moves',
            headerName: 'Moves',
            valueGetter: (params) => {
                if(params.row.initialMoves === undefined) {
                    return ""
                } else {
                    return params.row.initialMoves
                        .map((move: string, ply: number) => {
                            if (ply % 2 === 0) {
                                const moveNum = 1 + Math.trunc(ply / 2);
                                return `${moveNum}.${move}`
                            } else {
                                return `${move}`
                            }
                        })
                        .join(" ")
                }
            },
            width: 200,
        },
        {
            field: 'category',
            headerName: 'Category',
            width: 200,
            valueGetter: (params) => {
                if(params.row.type === "endgame") {
                    return "Endgame"
                } else if(params.row.color === "w") {
                    return "White opening"
                } else {
                    return "Black opening"
                }
            }
        },
    ];

    const customToolbar = () => <GridToolbarContainer>
        <GridToolbarQuickFilter sx={{width: 1 }}/>
    </GridToolbarContainer>

    const onCellClick: GridEventListener<'cellClick'> = (params) => {
        if(params.colDef.field === 'name') {
            navigate(`/book/books/${params.row.id}`)
        }
    };

    const startSelection = useCallback((selectionMode: string) => {
        setSelectionMode(selectionMode)
        setMenuAnchor(null)
        gridApiRef.current?.setRowSelectionModel([])
    }, [setSelectionMode, gridApiRef])

    const onDelete = useCallback(() => {
        if(operationInProgress !== null || selection.length === 0) {
            return
        }
        setSelectionMode(null)
        if(selection.length === 1) {
            setOperationInProgress("Deleting book...")
        } else {
            setOperationInProgress("Deleting books...")
        }
        Promise.all(
            selection.map((bookId) => deleteBook('test-user', bookId as string))
        ).then(() => {
            setOperationInProgress(null)
            setBookList(bookList.filter(b => selection.indexOf(b.id) === -1))
        })

    }, [selection, operationInProgress, setOperationInProgress, bookList, setBookList])

    const onExport = useCallback(() => {
        if(operationInProgress !== null || selection.length === 0) {
            return
        }
        setSelectionMode(null)
        if(selection.length === 1) {
            setOperationInProgress("Exporting book...")
        } else {
            setOperationInProgress("Exporting books...")
        }
        const lastModified = new Date()
        Promise.all(
            selection.map((bookId) => getBook('test-user', bookId as string)
                .then(book => {
                    if (book === undefined) {
                        throw Error(`Book not found: ${bookId}`)
                    }
                    return book
                })
            )
        ).then((books) => {
            if (books.length > 1) {
                const zipItems = books.map(book => ({
                    name: `${book.name}.pgn`,
                    input: exportBook(book),
                    lastModified,
                }))
                downloadZip(zipItems).blob().then(blob => downloadBlob(blob, "BookExport.zip"))
            } else {
                downloadBlob(
                    new Blob([exportBook(books[0])], {
                        type: 'application/vnd.chess-pgn'
                    }),
                    `${books[0].name}.pgn`
                )
            }

            function downloadBlob(blob: Blob, filename: string) {
                const link = document.createElement("a")
                const url = URL.createObjectURL(blob)
                link.href = url
                link.download = filename
                link.click()
                setTimeout(() => {
                    URL.revokeObjectURL(url)
                    link.remove()
                }, 0)
            }

            setOperationInProgress(null)
        })

    }, [selection, operationInProgress, setOperationInProgress])

    const onImport = useCallback(() => {
        setMenuAnchor(null)
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => { 
            const target = e.currentTarget as HTMLInputElement
            for(const file of target.files!) {
                if(!file.name.endsWith('.pgn')) {
                    continue
                }
                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = readerEvent => {
                    var content = readerEvent.target!.result as string;
                    try {
                        const book = importBook(content)
                        putBook('test-user', book).then(() => setBookList([...bookList, book]))
                    } catch (e) {
                        console.error("Error importing book: ", e)
                        return
                    }
                }
            }
        }
        input.click();
    }, [bookList, setBookList])

    let content
    if (bookList.length === 0) {
        content = <Paper sx={{ p: 3, width: 1}}>
            <Typography variant="h4" fontStyle="italic" pb={1}>No books added</Typography>
            <Typography variant="body1">Add a book to get started.</Typography>
        </Paper>
    } else {
        content = <DataGridPro
            apiRef={gridApiRef}
            sx={{flexGrow: 1}}
            columns={columns}
            rows={bookList}
            disableColumnResize={true}
            disableColumnReorder={true}
            disableColumnMenu={true}
            hideFooter={true}
            onCellClick={onCellClick}
            checkboxSelection={selectionMode !== null}
            onRowSelectionModelChange={setSelection}
            slots={{ toolbar: customToolbar }}
        />
    }

    let bottom
    if (operationInProgress !== null) {
        bottom = <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="h5">{operationInProgress}</Typography>
        </Stack>
    } else if (selectionMode === "export") {
        bottom = <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
                <Button variant="contained" sx={{ px: 10, py: 2}} onClick={onExport}>Export</Button>
                <Button variant="outlined" sx={{ px: 10, py: 2}} onClick={() => setSelectionMode(null)}>Cancel</Button>
            </Stack>
        </Stack>
    } else if (selectionMode === "delete") {
        bottom = <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
                <Button variant="contained" sx={{ px: 10, py: 2}} onClick={onDelete}>Delete</Button>
                <Button variant="outlined" sx={{ px: 10, py: 2}} onClick={() => setSelectionMode(null)}>Cancel</Button>
            </Stack>
        </Stack>
    } else {
        bottom = <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={5}>
                <Button component={RouterLink} to="/book/books/new-opening" variant="contained" sx={{ px: 10, py: 2}}>Add Opening Book</Button>
                <Button component={RouterLink} to="/book/books/new-endgame" variant="contained" sx={{ px: 10, py: 2}}>Add Endgame Book</Button>
            </Stack>
            <Button onClick={(elt) => setMenuAnchor(elt.currentTarget)}>
                <MenuIcon />
            </Button>
            <Menu open={menuAnchor !== null} anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => startSelection("delete")} divider>
                    <ListItemIcon><DeleteIcon /></ListItemIcon>
                    <ListItemText>Delete Books</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => startSelection("export")}>
                    <ListItemIcon><FileDownloadIcon /></ListItemIcon>
                    <ListItemText>Export Books</ListItemText>
                </MenuItem>
                <MenuItem onClick={onImport}>
                    <ListItemIcon><FileUploadIcon /></ListItemIcon>
                    <ListItemText>Import Books</ListItemText>
                </MenuItem>
            </Menu>
        </Stack>
    }

    return <Stack spacing={5}>
        { content }
        { bottom }
    </Stack>
}

export default BookList;
