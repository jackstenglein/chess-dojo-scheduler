use serde::Deserialize;

#[derive(Deserialize, Debug, Default, Copy, Clone)]
#[serde(rename_all = "lowercase")]
pub enum BoardTheme {
    #[default]
    Standard,
    Moon,
    Summer,
    Wood,
    Walnut,
    #[serde(rename = "cherry_blossom")]
    CherryBlossom,
    Ocean,
}

pub struct ByBoardTheme<T> {
    inner: [T; 7],
}

impl<T> ByBoardTheme<T> {
    pub fn new<F>(f: F) -> ByBoardTheme<T>
    where
        F: FnMut(BoardTheme) -> T,
    {
        use BoardTheme::*;
        ByBoardTheme {
            inner: [Standard, Moon, Summer, Wood, Walnut, CherryBlossom, Ocean].map(f),
        }
    }

    pub fn by_board_theme(&self, board: BoardTheme) -> &T {
        &self.inner[board as usize]
    }
}

#[derive(Deserialize, Debug, Default, Copy, Clone, Eq, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PieceSet {
    #[default]
    Standard,
    Pixel,
    Wood,
    Celtic,
    Fantasy,
    Cherry,
    Walnut,
}

pub struct ByPieceSet<T> {
    inner: [T; 7],
}

impl<T> ByPieceSet<T> {
    pub fn new<F>(f: F) -> ByPieceSet<T>
    where
        F: FnMut(PieceSet) -> T,
    {
        use PieceSet::*;
        ByPieceSet {
            inner: [
                Standard,
                Pixel,
                Wood,
                Celtic,
                Fantasy,
                Cherry,
                Walnut,
            ]
            .map(f),
        }
    }

    pub fn by_piece_set(&self, piece_set: PieceSet) -> &T {
        &self.inner[piece_set as usize]
    }
}

pub fn sprite_data(board: BoardTheme, pieces: PieceSet) -> &'static [u8] {
    use PieceSet::*;
    match board {
        BoardTheme::Standard => match pieces {
            Standard => include_bytes!("../theme/sprites/standard-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/standard-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/standard-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/standard-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/standard-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/standard-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/standard-walnut.gif"),
        },
        BoardTheme::Moon => match pieces {
            Standard => include_bytes!("../theme/sprites/moon-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/moon-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/moon-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/moon-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/moon-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/moon-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/moon-walnut.gif"),
        },
        BoardTheme::Summer => match pieces {
            Standard => include_bytes!("../theme/sprites/summer-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/summer-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/summer-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/summer-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/summer-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/summer-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/summer-walnut.gif"),
        },
        BoardTheme::Wood => match pieces {
            Standard => include_bytes!("../theme/sprites/wood-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/wood-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/wood-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/wood-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/wood-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/wood-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/wood-walnut.gif"),
        },
        BoardTheme::Walnut => match pieces {
            Standard => include_bytes!("../theme/sprites/walnut-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/walnut-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/walnut-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/walnut-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/walnut-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/walnut-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/walnut-walnut.gif"),
        },
        BoardTheme::CherryBlossom => match pieces {
            Standard => include_bytes!("../theme/sprites/cherry_blossom-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/cherry_blossom-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/cherry_blossom-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/cherry_blossom-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/cherry_blossom-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/cherry_blossom-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/cherry_blossom-walnut.gif"),
        },
        BoardTheme::Ocean => match pieces {
            Standard => include_bytes!("../theme/sprites/ocean-standard.gif"),
            Pixel => include_bytes!("../theme/sprites/ocean-pixel.gif"),
            Wood => include_bytes!("../theme/sprites/ocean-wood.gif"),
            Celtic => include_bytes!("../theme/sprites/ocean-celtic.gif"),
            Fantasy => include_bytes!("../theme/sprites/ocean-fantasy.gif"),
            Cherry => include_bytes!("../theme/sprites/ocean-cherry.gif"),
            Walnut => include_bytes!("../theme/sprites/ocean-walnut.gif"),
        },
    }
}

#[cfg(test)]
mod tests {
    use std::convert::identity;

    use super::*;

    #[test]
    fn test_by_piece_set() {
        assert_eq!(
            ByPieceSet::new(identity).by_piece_set(PieceSet::Tatiana),
            &PieceSet::Tatiana
        );
    }
}
